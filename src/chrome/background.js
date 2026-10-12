let history = [];
let index = -1;
let expectedActivation = null;
let pending = Promise.resolve();

const tabInfo = tab => ({ id: tab.id, url: tab.url || '', title: tab.title || '' });

async function save() {
    await chrome.storage.local.set({ tabs: history, currentIndex: index });
}

async function restore() {
    const stored = await chrome.storage.local.get(['tabs', 'currentIndex']);
    const openTabs = (await chrome.tabs.query({ currentWindow: true })).filter(tab => !tab.pinned);
    const byId = new Map(openTabs.map(tab => [tab.id, tab]));
    const byUrl = new Map();
    for (const tab of openTabs) {
        if (tab.url && !byUrl.has(tab.url)) byUrl.set(tab.url, tab);
    }
    const oldHistory = Array.isArray(stored.tabs) ? stored.tabs : [];
    const oldIndex = Number.isInteger(stored.currentIndex) ? stored.currentIndex : oldHistory.length - 1;
    let restoredIndex = -1;
    history = [];
    for (let i = 0; i < oldHistory.length; i++) {
        const item = oldHistory[i];
        if (!item || typeof item !== 'object') continue;
        const tab = byId.get(item.id) || byUrl.get(item.url);
        if (!tab) continue;
        history.push(tabInfo(tab));
        if (i <= oldIndex) restoredIndex = history.length - 1;
    }
    index = restoredIndex;
    const active = openTabs.find(tab => tab.active);
    if (active && (index < 0 || history[index]?.id !== active.id)) {
        history = history.slice(0, index + 1);
        history.push(tabInfo(active));
        index = history.length - 1;
    }
    await save();
}

const ready = restore().catch(error => console.error('Cannot restore tab history:', error));
function enqueue(work) {
    pending = pending.then(() => ready).then(work).catch(error => console.error('Tab Navigator:', error));
    return pending;
}

chrome.tabs.onActivated.addListener(info => enqueue(async () => {
    if (info.tabId === expectedActivation) {
        expectedActivation = null;
        return;
    }
    const tab = await chrome.tabs.get(info.tabId);
    if (tab.pinned || history[index]?.id === tab.id) return;
    history = history.slice(0, index + 1);
    history.push(tabInfo(tab));
    index = history.length - 1;
    await save();
}));

chrome.tabs.onUpdated.addListener((tabId, changes, tab) => {
    if (!changes.url && !changes.title) return;
    enqueue(async () => {
        let changed = false;
        for (const item of history) {
            if (item.id !== tabId) continue;
            item.url = tab.url || '';
            item.title = tab.title || '';
            changed = true;
        }
        if (changed) await save();
    });
});

chrome.tabs.onRemoved.addListener(tabId => enqueue(async () => {
    const before = history.slice(0, index + 1).filter(item => item.id !== tabId).length;
    const remaining = history.filter(item => item.id !== tabId);
    if (remaining.length === history.length) return;
    history = remaining;
    index = Math.min(before - 1, history.length - 1);
    await save();
}));

chrome.commands.onCommand.addListener(command => enqueue(async () => {
    const direction = command === 'navigate-back' ? -1 : command === 'navigate-forward' ? 1 : 0;
    if (!direction) return;
    const openTabs = (await chrome.tabs.query({ currentWindow: true })).filter(tab => !tab.pinned);
    const byId = new Map(openTabs.map(tab => [tab.id, tab]));
    const byUrl = new Map();
    for (const tab of openTabs) {
        if (tab.url && !byUrl.has(tab.url)) byUrl.set(tab.url, tab);
    }
    for (let next = index + direction; next >= 0 && next < history.length; next += direction) {
        const item = history[next];
        const tab = byId.get(item.id) || byUrl.get(item.url);
        if (!tab) continue;
        expectedActivation = tab.id;
        try {
            await chrome.tabs.update(tab.id, { active: true });
            index = next;
            history[next] = tabInfo(tab);
            await save();
            setTimeout(() => {
                if (expectedActivation === tab.id) expectedActivation = null;
            }, 1000);
            return;
        } catch (error) {
            expectedActivation = null;
            console.error('Cannot activate tab:', error);
        }
    }
}));
