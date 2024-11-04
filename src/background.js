const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let tabHistory = [];
let currentHistoryIndex = -1;
let navigatingThroughHistory = false;
let initialized = false;

// Helper function to get tab info
async function getTabInfo(tabId) {
  try {
    const tab = await browserAPI.tabs.get(tabId);
    return {
      id: tab.id,
      url: tab.url,
      title: tab.title
    };
  } catch (error) {
    console.error("Error getting tab info:", error);
    return null;
  }
}

// Load saved history when extension starts
async function loadHistory() {
  if (initialized) return;

  try {
    const result = await browserAPI.storage.local.get(['tabHistory', 'currentHistoryIndex']);
    console.log('Loaded history:', result);

    if (result.tabHistory && result.tabHistory.length > 0) {
      // Verify existing tabs and update their IDs
      const existingTabs = await browserAPI.tabs.query({});
      const urlToTab = new Map(existingTabs.map(tab => [tab.url, tab]));

      // Update tab IDs based on URLs
      tabHistory = result.tabHistory
        .map(historyItem => {
          const newTab = urlToTab.get(historyItem.url);
          return newTab ? {
            id: newTab.id,
            url: newTab.url,
            title: newTab.title
          } : null;
        })
        .filter(item => item !== null);

      currentHistoryIndex = result.currentHistoryIndex;
      if (currentHistoryIndex >= tabHistory.length) {
        currentHistoryIndex = tabHistory.length - 1;
      }
    }

    // If history is empty or all tabs were filtered out, initialize with current tab
    if (tabHistory.length === 0) {
      const [activeTab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        const tabInfo = await getTabInfo(activeTab.id);
        if (tabInfo) {
          tabHistory = [tabInfo];
          currentHistoryIndex = 0;
          await saveHistory();
        }
      }
    }
  } catch (error) {
    console.error("Error loading history:", error);

    // Initialize with current tab on error
    const [activeTab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      const tabInfo = await getTabInfo(activeTab.id);
      if (tabInfo) {
        tabHistory = [tabInfo];
        currentHistoryIndex = 0;
        await saveHistory();
      }
    }
  }

  initialized = true;
  console.log('Initialization complete:', { tabHistory, currentHistoryIndex });
}

// Save history to storage
async function saveHistory() {
  try {
    const data = {
      tabHistory,
      currentHistoryIndex
    };
    await browserAPI.storage.local.set(data);
    console.log('Saved history:', data);
  } catch (error) {
    console.error("Error saving history:", error);
  }
}

// Listen for tab activation
browserAPI.tabs.onActivated.addListener(async (activeInfo) => {
  await loadHistory();

  if (!navigatingThroughHistory) {
    const tabInfo = await getTabInfo(activeInfo.tabId);
    if (!tabInfo) return;

    // Truncate future history if we're not at the end
    if (currentHistoryIndex < tabHistory.length - 1) {
      tabHistory = tabHistory.slice(0, currentHistoryIndex + 1);
    }

    // Only add to history if it's a different URL
    const lastTab = tabHistory[tabHistory.length - 1];
    if (!lastTab || lastTab.url !== tabInfo.url) {
      tabHistory.push(tabInfo);
      currentHistoryIndex = tabHistory.length - 1;
      await saveHistory();
    }
  }
});

// Listen for tab URL changes
browserAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const currentTab = tabHistory[currentHistoryIndex];
    if (currentTab && currentTab.id === tabId) {
      currentTab.url = tab.url;
      currentTab.title = tab.title;
      await saveHistory();
    }
  }
});

// Listen for tab removal
browserAPI.tabs.onRemoved.addListener(async (tabId) => {
  const index = tabHistory.findIndex(tab => tab.id === tabId);
  if (index > -1) {
    tabHistory = tabHistory.filter(tab => tab.id !== tabId);
    if (currentHistoryIndex >= index) {
      currentHistoryIndex = Math.max(0, Math.min(currentHistoryIndex - 1, tabHistory.length - 1));
    }
    await saveHistory();
  }
});

// Handle keyboard shortcuts
browserAPI.commands.onCommand.addListener(async (command) => {
  await loadHistory();

  if (tabHistory.length <= 1) return;

  navigatingThroughHistory = true;

  try {
    if (command === "navigate-back" && currentHistoryIndex > 0) {
      currentHistoryIndex--;
      const targetTab = tabHistory[currentHistoryIndex];
      console.log('Navigating back to:', targetTab);
      await browserAPI.tabs.update(targetTab.id, { active: true });
    } else if (command === "navigate-forward" && currentHistoryIndex < tabHistory.length - 1) {
      currentHistoryIndex++;
      const targetTab = tabHistory[currentHistoryIndex];
      console.log('Navigating forward to:', targetTab);
      await browserAPI.tabs.update(targetTab.id, { active: true });
    }
    await saveHistory();
  } catch (error) {
    console.error("Error navigating tab history:", error);
  }

  setTimeout(() => {
    navigatingThroughHistory = false;
  }, 100);
});

// Listen for extension installation or update
browserAPI.runtime.onInstalled.addListener(loadHistory);

// Initialize when script loads
loadHistory();