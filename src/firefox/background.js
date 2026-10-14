let history = [];
let index = -1;
let expectedActivation = null;
let pending = Promise.resolve();

const tabInfo = tab => ({ id: tab.id, url: tab.url || '', title: tab.title || '' });

async function save() {
    await browser.storage.local.set({ tabHistory: history, currentHistoryIndex: index });
}

async function restore() {
    const stored = await browser.storage.local.get(['tabHistory', 'currentHistoryIndex']);
    // The current window of the background page is the last focused one. Keep history entries from every window.
    const openTabs = await browser.tabs.query({});
    const byId = new Map(openTabs.map(tab => [tab.id, tab]));
    const byUrl = new Map();
    for (const tab of openTabs) {
        if (tab.url && !byUrl.has(tab.url)) byUrl.set(tab.url, tab);
    }
    const oldHistory = Array.isArray(stored.tabHistory) ? stored.tabHistory : [];
    const oldIndex = Number.isInteger(stored.currentHistoryIndex) ? stored.currentHistoryIndex : oldHistory.length - 1;
    let restoredIndex = -1;
    history = [];
    for (let i = 0; i < oldHistory.length; i++) {
        const item = oldHistory[i];
        const tab = typeof item === 'number' ? byId.get(item) :
            item && typeof item === 'object' ? byId.get(item.id) || byUrl.get(item.url) : null;
        if (!tab) continue;
        history.push(tabInfo(tab));
        if (i <= oldIndex) restoredIndex = history.length - 1;
    }
    index = restoredIndex;
    const [active] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
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

browser.tabs.onActivated.addListener(info => enqueue(async () => {
    if (info.tabId === expectedActivation) {
        expectedActivation = null;
        return;
    }
    const tab = await browser.tabs.get(info.tabId);
    if (history[index]?.id === tab.id) return;
    history = history.slice(0, index + 1);
    history.push(tabInfo(tab));
    index = history.length - 1;
    await save();
}));

browser.tabs.onUpdated.addListener((tabId, changes, tab) => {
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

browser.tabs.onRemoved.addListener(tabId => enqueue(async () => {
    const before = history.slice(0, index + 1).filter(item => item.id !== tabId).length;
    const remaining = history.filter(item => item.id !== tabId);
    if (remaining.length === history.length) return;
    history = remaining;
    index = Math.min(before - 1, history.length - 1);
    await save();
}));

browser.commands.onCommand.addListener(command => enqueue(async () => {
    const direction = command === 'navigate-back' ? -1 : command === 'navigate-forward' ? 1 : 0;
    if (!direction) return;
    const openTabs = await browser.tabs.query({ currentWindow: true });
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
            await browser.tabs.update(tab.id, { active: true });
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
