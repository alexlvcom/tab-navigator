let tabHistory = [];
let currentHistoryIndex = -1;
let navigatingThroughHistory = false;

// Load saved history when extension starts
async function loadHistory() {
  try {
    const result = await browser.storage.local.get(['tabHistory', 'currentHistoryIndex']);
    if (result.tabHistory) {
      const existingTabs = await browser.tabs.query({});
      const existingTabIds = new Set(existingTabs.map(tab => tab.id));

      tabHistory = result.tabHistory.filter(tabId => existingTabIds.has(tabId));
      currentHistoryIndex = Math.min(result.currentHistoryIndex, tabHistory.length - 1);

      if (tabHistory.length === 0) {
        const activeTab = await browser.tabs.query({ active: true, currentWindow: true });
        if (activeTab[0]) {
          tabHistory = [activeTab[0].id];
          currentHistoryIndex = 0;
        }
      }
    }
  } catch (error) {
    console.error("Error loading history:", error);
    const activeTab = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTab[0]) {
      tabHistory = [activeTab[0].id];
      currentHistoryIndex = 0;
    }
  }
}

// Save history to storage
async function saveHistory() {
  try {
    await browser.storage.local.set({
      tabHistory: tabHistory,
      currentHistoryIndex: currentHistoryIndex
    });
  } catch (error) {
    console.error("Error saving history:", error);
  }
}

// Listen for tab activation
browser.tabs.onActivated.addListener(async (activeInfo) => {
  if (!navigatingThroughHistory) {
    if (currentHistoryIndex < tabHistory.length - 1) {
      tabHistory = tabHistory.slice(0, currentHistoryIndex + 1);
    }

    tabHistory.push(activeInfo.tabId);
    currentHistoryIndex = tabHistory.length - 1;
    await saveHistory();
  }
});

// Listen for tab removal
browser.tabs.onRemoved.addListener(async (tabId) => {
  const index = tabHistory.indexOf(tabId);
  if (index > -1) {
    tabHistory.splice(index, 1);
    if (currentHistoryIndex >= index) {
      currentHistoryIndex--;
    }
    await saveHistory();
  }
});

// Handle keyboard shortcuts
browser.commands.onCommand.addListener(async (command) => {
  if (tabHistory.length <= 1) return;

  navigatingThroughHistory = true;

  try {
    if (command === "navigate-back" && currentHistoryIndex > 0) {
      currentHistoryIndex--;
      await browser.tabs.update(tabHistory[currentHistoryIndex], { active: true });
    } else if (command === "navigate-forward" && currentHistoryIndex < tabHistory.length - 1) {
      currentHistoryIndex++;
      await browser.tabs.update(tabHistory[currentHistoryIndex], { active: true });
    }
    await saveHistory();
  } catch (error) {
    console.error("Error navigating tab history:", error);
  }

  setTimeout(() => {
    navigatingThroughHistory = false;
  }, 100);
});

// Load history when extension starts
loadHistory();