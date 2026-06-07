const DEFAULT_SETTINGS = {
  globalEnabled: true,
  uiLanguage: '',
  firstRunLanguage: false,
  domainOverrides: {}
};

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason !== 'install') {
    return;
  }

  chrome.storage.local.set({ firstRunLanguage: true }, () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });
});

function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith('http') ? parsed.hostname : '';
  } catch (error) {
    return '';
  }
}

function isEnabledForDomain(settings, domain) {
  if (!domain) {
    return false;
  }

  const override = settings.domainOverrides?.[domain];
  return typeof override === 'boolean' ? override : settings.globalEnabled;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') {
    return;
  }

  const domain = getDomain(tab.url || '');
  chrome.storage.local.get(DEFAULT_SETTINGS, data => {
    if (!isEnabledForDomain(data, domain)) {
      return;
    }

    chrome.tabs.sendMessage(tabId, { type: 'JDC_SETTINGS_CHANGED' }, () => {
      const error = chrome.runtime.lastError;
      if (!error) {
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/jalaali.js', 'src/content/content.js']
      }).catch(() => {});
    });
  });
});
