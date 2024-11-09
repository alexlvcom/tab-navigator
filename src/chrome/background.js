let savedTabs = [];
let currentIndex = -1;
let navigatingThroughHistory = false;
let lastSaveTime = Date.now();

function logState(action) {
    console.log('='.repeat(50));
    console.log(action, {
        tabCount: savedTabs.length,
        currentIndex,
        tabs: savedTabs.map(t => t.title)
    });
    console.log('='.repeat(50));
}

// Function to clean up startup pattern
function cleanStartupPattern(tabs, index) {
    if (tabs.length < 3) return { tabs, index };

    // Check if this might be a startup scenario (more than 5 seconds since last save)
    const isStartupScenario = (Date.now() - lastSaveTime) > 5000;

    if (isStartupScenario) {
        const len = tabs.length;
        const currentTab = tabs[len - 1];
        const prevTab = tabs[len - 2];
        const prevPrevTab = tabs[len - 3];

        // Check if current tab matches prev-prev tab and prev tab doesn't exist in earlier history
        if (currentTab.url === prevPrevTab.url &&
            !tabs.slice(0, len - 2).some(tab => tab.url === prevTab.url)) {
            console.log('Detected and removing startup pattern');
            return {
                tabs: tabs.slice(0, -2),
                index: Math.min(index, tabs.length - 3)
            };
        }
    }

    return { tabs, index };
}

async function saveHistory() {
    try {
        // Clean up startup pattern if present
        const cleaned = cleanStartupPattern(savedTabs, currentIndex);
        savedTabs = cleaned.tabs;
        currentIndex = cleaned.index;

        await chrome.storage.local.set({
            tabs: savedTabs,
            currentIndex
        });
        lastSaveTime = Date.now();
        logState('State saved');
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

// Rest of the code stays the same...

async function loadHistory() {
    try {
        const result = await chrome.storage.local.get(['tabs', 'currentIndex']);
        console.log('Loading saved state:', result);

        if (result.tabs?.length > 0) {
            // Clean startup tabs first
            const cleaned = removeStartupTabs(result.tabs, result.currentIndex);
            savedTabs = cleaned.tabs;
            currentIndex = cleaned.index;

            // Map current tabs
            const currentTabs = await chrome.tabs.query({ currentWindow: true });
            const urlToTab = new Map(
                currentTabs
                    .filter(tab => !tab.pinned)
                    .map(tab => [tab.url, tab])
            );

            // Update tab IDs
            savedTabs = savedTabs.map(oldTab => {
                const newTab = urlToTab.get(oldTab.url);
                return newTab ? {
                    ...oldTab,
                    id: newTab.id
                } : oldTab;
            });

            logState('Restored state');
        } else {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab && !activeTab.pinned) {
                savedTabs = [{
                    id: activeTab.id,
                    url: activeTab.url,
                    title: activeTab.title
                }];
                currentIndex = 0;
            }
        }
        await saveHistory();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    if (navigatingThroughHistory) return;

    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.pinned) return;

    console.log('Tab activated:', tab.title);

    // Truncate future history
    if (currentIndex < savedTabs.length - 1) {
        savedTabs = savedTabs.slice(0, currentIndex + 1);
    }

    // Add new tab
    savedTabs.push({
        id: tab.id,
        url: tab.url,
        title: tab.title
    });
    currentIndex = savedTabs.length - 1;
    await saveHistory();
});

chrome.commands.onCommand.addListener(async (command) => {
    if (savedTabs.length <= 1) return;

    navigatingThroughHistory = true;

    try {
        if (command === "navigate-back" && currentIndex > 0) {
            currentIndex--;
            const targetTab = savedTabs[currentIndex];
            console.log('Navigating back to:', targetTab.title);

            const tabs = await chrome.tabs.query({ currentWindow: true });
            let tab = tabs.find(t => t.id === targetTab.id);
            if (!tab) {
                tab = tabs.find(t => t.url === targetTab.url && t.id !== targetTab.id);
            }
            if (tab) {
                await chrome.tabs.update(tab.id, { active: true });
                savedTabs[currentIndex].id = tab.id;
                await saveHistory();
            }
        } else if (command === "navigate-forward" && currentIndex < savedTabs.length - 1) {
            currentIndex++;
            const targetTab = savedTabs[currentIndex];
            console.log('Navigating forward to:', targetTab.title);

            const tabs = await chrome.tabs.query({ currentWindow: true });
            let tab = tabs.find(t => t.id === targetTab.id);
            if (!tab) {
                tab = tabs.find(t => t.url === targetTab.url && t.id !== targetTab.id);
            }
            if (tab) {
                await chrome.tabs.update(tab.id, { active: true });
                savedTabs[currentIndex].id = tab.id;
                await saveHistory();
            }
        }
    } catch (error) {
        console.error('Error navigating:', error);
    }

    setTimeout(() => {
        navigatingThroughHistory = false;
    }, 100);
});

// Initialize
loadHistory();