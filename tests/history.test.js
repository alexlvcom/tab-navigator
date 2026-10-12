const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

async function launch(browserName, tabs, saved) {
    const listeners = {};
    const storage = structuredClone(saved);
    const events = name => ({ addListener(fn) { listeners[name] = fn; } });
    const api = {
        storage: { local: {
            async get() { return structuredClone(storage); },
            async set(value) { Object.assign(storage, structuredClone(value)); }
        } },
        tabs: {
            async query() { return tabs.map(tab => ({ ...tab })); },
            async get(id) { return { ...tabs.find(tab => tab.id === id) }; },
            async update(id) {
                for (const tab of tabs) tab.active = tab.id === id;
                listeners.activated({ tabId: id });
            },
            onActivated: events('activated'),
            onUpdated: events('updated'),
            onRemoved: events('removed')
        },
        commands: { onCommand: events('command') }
    };
    const source = fs.readFileSync(path.join(__dirname, '..', 'src', browserName, 'background.js'), 'utf8');
    vm.runInNewContext(source, { [browserName === 'chrome' ? 'chrome' : 'browser']: api, console, setTimeout });
    await new Promise(resolve => setImmediate(resolve));
    return {
        storage,
        tabs,
        async activate(id) {
            for (const tab of tabs) tab.active = tab.id === id;
            await listeners.activated({ tabId: id });
        },
        async command(name) {
            await listeners.command(name);
            await new Promise(resolve => setImmediate(resolve));
        },
        async remove(id) {
            tabs.splice(tabs.findIndex(tab => tab.id === id), 1);
            await listeners.removed(id);
        }
    };
}

for (const browser of ['chrome', 'firefox']) {
    const historyKey = browser === 'chrome' ? 'tabs' : 'tabHistory';
    const indexKey = browser === 'chrome' ? 'currentIndex' : 'currentHistoryIndex';
    test(`${browser}: back and forward after restored IDs change`, async () => {
        const tabs = [
            { id: 11, url: 'https://a.test/', title: 'A', active: false },
            { id: 22, url: 'https://b.test/', title: 'B', active: true }
        ];
        const saved = {
            [historyKey]: [{ id: 1, url: tabs[0].url }, { id: 2, url: tabs[1].url }],
            [indexKey]: 1
        };
        const app = await launch(browser, tabs, saved);
        await app.command('navigate-back');
        assert.equal(tabs.find(tab => tab.active).id, 11);
        await app.command('navigate-forward');
        assert.equal(tabs.find(tab => tab.active).id, 22);
    });

    test(`${browser}: manual activation and closed tab`, async () => {
        const tabs = [
            { id: 11, url: 'https://a.test/', title: 'A', active: true },
            { id: 22, url: 'https://b.test/', title: 'B', active: false }
        ];
        const app = await launch(browser, tabs, {});
        await app.activate(22);
        await app.command('navigate-back');
        assert.equal(tabs.find(tab => tab.active).id, 11);
        await app.remove(22);
        assert.equal(app.storage[historyKey].length, 1);
        assert.equal(app.storage[indexKey], 0);
    });

    test(`${browser}: tabs with the same URL remain distinct`, async () => {
        const tabs = [
            { id: 11, url: 'https://same.test/', title: 'A', active: true },
            { id: 22, url: 'https://same.test/', title: 'B', active: false }
        ];
        const app = await launch(browser, tabs, {});
        await app.activate(22);
        await app.command('navigate-back');
        assert.equal(tabs.find(tab => tab.active).id, 11);
    });
}
