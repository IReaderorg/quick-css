/**
 * IReader Selector Helper - Background Service Worker
 * Simple: Click icon → inject selector tool
 */

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
    return;
  }

  try {
    // Inject the selector tool
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['selector.js']
    });

    // Inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['selector.css']
    });

    // Activate selection mode
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.IReaderSelector) {
          window.IReaderSelector.activate();
        }
      }
    });
  } catch (e) {
    console.error('[IReader] Failed to inject:', e);
  }
});

console.log('[IReader] Background ready');
