const DEFAULT_SETTINGS = {
  globalEnabled: true,
  convertDates: true,
  convertTimes: false,
  convertRelativeTimes: true,
  timeZone: 'Asia/Tehran',
  sourceTimeZone: 'UTC',
  calendarSystem: 'jalali',
  uiLanguage: '',
  dateFormatMode: 'preserve',
  customDateFormat: 'YYYY/MM/DD',
  timeFormat: 'preserve',
  directionMode: 'inherit',
  textAlignMode: 'inherit',
  outputLocale: 'fa-IR',
  numberMode: 'none',
  fontFamily: '',
  fontSize: '',
  manualSelector: '',
  siteSettings: {},
  domainSelectors: {},
  domainOverrides: {},
  relativeDefaultMigrated: false,
  relativeDefaultVersion: 0
};
const RELATIVE_DEFAULT_VERSION = 2;

const api = chrome;
const toggleGlobal = document.getElementById('toggleGlobal');
const toggleDomain = document.getElementById('toggleDomain');
const toggleRelativeGlobal = document.getElementById('toggleRelativeGlobal');
const domainLabel = document.getElementById('domainLabel');
const domainHint = document.getElementById('domainHint');
const statusText = document.getElementById('statusText');
const openOptionsButton = document.getElementById('openOptions');
const openAboutButton = document.getElementById('openAbout');
const startPickerButton = document.getElementById('startPicker');
const quickFont = document.getElementById('quickFont');
const loadQuickSystemFonts = document.getElementById('loadQuickSystemFonts');
const quickFontSize = document.getElementById('quickFontSize');
const quickConvertRelativeTimes = document.getElementById('quickConvertRelativeTimes');
const quickDirection = document.getElementById('quickDirection');
const quickAlign = document.getElementById('quickAlign');
const quickDateMode = document.getElementById('quickDateMode');
const quickCalendarSystem = document.getElementById('quickCalendarSystem');
const quickCustomDate = document.getElementById('quickCustomDate');
const quickTimeFormat = document.getElementById('quickTimeFormat');
const quickNumberMode = document.getElementById('quickNumberMode');
const quickOutputLocale = document.getElementById('quickOutputLocale');
const saveQuickSiteButton = document.getElementById('saveQuickSite');
const resetQuickSiteButton = document.getElementById('resetQuickSite');
const dirtyNote = document.getElementById('dirtyNote');

let activeTab = null;
let activeDomain = '';
let settings = { ...DEFAULT_SETTINGS };
let dirty = false;
let applyingControls = false;
let previewTimer = 0;

function tr(key, fallback = '') {
  return window.JDC_I18N?.t(key, fallback) || fallback || key;
}

function promisify(callbackRunner) {
  return new Promise((resolve, reject) => {
    try {
      callbackRunner(resolve);
    } catch (error) {
      reject(error);
    }
  });
}

function getStorage(keys) {
  return promisify(resolve => api.storage.local.get(keys, resolve));
}

function setStorage(values) {
  return promisify(resolve => api.storage.local.set(values, resolve));
}

async function migrateRelativeDefault(stored) {
  if ((stored.relativeDefaultVersion || 0) >= RELATIVE_DEFAULT_VERSION) {
    return stored;
  }

  const siteSettings = Object.fromEntries(Object.entries(stored.siteSettings || {}).map(([domain, values]) => [
    domain,
    {
      ...values,
      convertRelativeTimes: true
    }
  ]));
  const next = {
    ...stored,
    convertRelativeTimes: true,
    siteSettings,
    relativeDefaultMigrated: true,
    relativeDefaultVersion: RELATIVE_DEFAULT_VERSION
  };
  await setStorage({
    convertRelativeTimes: true,
    siteSettings,
    relativeDefaultMigrated: true,
    relativeDefaultVersion: RELATIVE_DEFAULT_VERSION
  });
  return next;
}

function getActiveTab() {
  const query = { active: true, currentWindow: true };
  return promisify(resolve => api.tabs.query(query, tabs => resolve(tabs[0])));
}

function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith('http') ? parsed.hostname : '';
  } catch (error) {
    return '';
  }
}

function isDomainEnabled() {
  if (!activeDomain) {
    return false;
  }

  const override = settings.domainOverrides[activeDomain];
  return typeof override === 'boolean' ? override : settings.globalEnabled;
}

function applyControls() {
  applyingControls = true;
  const siteSettings = activeDomain ? settings.siteSettings?.[activeDomain] || {} : {};

  toggleGlobal.checked = settings.globalEnabled;
  toggleDomain.checked = isDomainEnabled();
  toggleRelativeGlobal.checked = settings.convertRelativeTimes;
  toggleDomain.disabled = !activeDomain;
  domainLabel.textContent = activeDomain || tr('domain.unknown', 'این صفحه قابل تغییر نیست');
  domainHint.textContent = activeDomain
    ? `${tr('domain.current', 'سایت فعلی')}: ${activeDomain}`
    : tr('domain.internalDisabled', 'برای صفحات داخلی مرورگر غیرفعال است.');
  quickFont.value = siteSettings.fontFamily ?? settings.fontFamily;
  quickFontSize.value = siteSettings.fontSize ?? settings.fontSize;
  quickConvertRelativeTimes.checked = siteSettings.convertRelativeTimes ?? settings.convertRelativeTimes;
  quickDirection.value = siteSettings.directionMode ?? settings.directionMode;
  quickAlign.value = siteSettings.textAlignMode ?? settings.textAlignMode;
  quickDateMode.value = siteSettings.dateFormatMode ?? settings.dateFormatMode;
  quickCalendarSystem.value = siteSettings.calendarSystem ?? settings.calendarSystem;
  quickCustomDate.value = siteSettings.customDateFormat ?? settings.customDateFormat;
  quickTimeFormat.value = siteSettings.timeFormat ?? settings.timeFormat;
  quickNumberMode.value = siteSettings.numberMode ?? settings.numberMode;
  quickOutputLocale.value = siteSettings.outputLocale ?? settings.outputLocale;
  saveQuickSiteButton.disabled = !activeDomain;
  resetQuickSiteButton.disabled = !activeDomain;
  setDirty(false);
  applyingControls = false;
}

async function populateSystemFonts() {
  await window.JDC_SYSTEM_FONTS?.populateFontSelect(quickFont, {
    defaultLabel: tr('option.siteFont', 'فونت سایت'),
    installedLabel: tr('font.installedGroup', 'فونت‌های نصب‌شده روی سیستم'),
    fallbackLabel: tr('font.fallbackGroup', 'فونت‌های عمومی سیستم'),
    selectedValues: [
      settings.fontFamily,
      ...Object.values(settings.siteSettings || {}).map(values => values?.fontFamily)
    ]
  });
}

function showStatus(message) {
  statusText.textContent = message;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    statusText.textContent = '';
  }, 1800);
}

function notifyActiveTab() {
  if (!activeTab?.id || !activeDomain) {
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: activeTab.id, allFrames: true },
    files: ['src/content/jalaali.js', 'src/content/content.js']
  }).then(() => chrome.scripting.executeScript({
    target: { tabId: activeTab.id, allFrames: true },
    func: () => window.__jalaliDateConverterPro?.refresh()
  })).catch(() => {});

  api.tabs.sendMessage(activeTab.id, { type: 'JDC_SETTINGS_CHANGED' }, () => {
    const error = chrome.runtime.lastError;
    if (!error) {
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: activeTab.id, allFrames: true },
      files: ['src/content/jalaali.js', 'src/content/content.js']
    }).catch(() => {});
  });
}

function sendActiveTabMessage(message) {
  if (!activeTab?.id || !activeDomain) {
    return;
  }

  const runInAllFrames = () => chrome.scripting.executeScript({
    target: { tabId: activeTab.id, allFrames: true },
    files: ['src/content/jalaali.js', 'src/content/content.js']
  }).then(() => chrome.scripting.executeScript({
    target: { tabId: activeTab.id, allFrames: true },
    args: [message],
    func: payload => {
      if (payload?.type === 'JDC_PREVIEW_SETTINGS') {
        window.__jalaliDateConverterPro?.preview(payload.settings || {});
      }

      if (payload?.type === 'JDC_SETTINGS_CHANGED') {
        window.__jalaliDateConverterPro?.refresh();
      }

      if (payload?.type === 'JDC_START_PICKER') {
        window.__jalaliDateConverterPro?.startPicker();
      }
    }
  })).catch(() => {});

  runInAllFrames();

  chrome.tabs.sendMessage(activeTab.id, message, () => {
    const error = chrome.runtime.lastError;
    if (!error) {
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: activeTab.id, allFrames: true },
      files: ['src/content/jalaali.js', 'src/content/content.js']
    }).then(() => {
      chrome.tabs.sendMessage(activeTab.id, message);
    }).catch(() => {});
  });
}

function getQuickPayload() {
  return {
    fontFamily: quickFont.value,
    fontSize: quickFontSize.value,
    convertRelativeTimes: quickConvertRelativeTimes.checked,
    directionMode: quickDirection.value,
    textAlignMode: quickAlign.value,
    dateFormatMode: quickDateMode.value,
    calendarSystem: quickCalendarSystem.value,
    customDateFormat: quickCustomDate.value.trim() || DEFAULT_SETTINGS.customDateFormat,
    timeFormat: quickTimeFormat.value,
    numberMode: quickNumberMode.value,
    outputLocale: quickOutputLocale.value
  };
}

function setDirty(value) {
  dirty = value;
  dirtyNote.hidden = !value;
}

function previewQuickSettings() {
  if (applyingControls || !activeDomain) {
    return;
  }

  setDirty(true);
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    sendActiveTabMessage({
      type: 'JDC_PREVIEW_SETTINGS',
      settings: getQuickPayload()
    });
  }, 120);
}

async function save(values) {
  settings = { ...settings, ...values };
  await setStorage(values);
  applyControls();
  notifyActiveTab();
  showStatus(tr('popup.saved', 'ذخیره شد و روی تب فعلی اعمال شد.'));
  setDirty(false);
}

async function init() {
  await window.JDC_I18N.initI18n();
  activeTab = await getActiveTab();
  activeDomain = getDomain(activeTab?.url || '');
  const stored = await migrateRelativeDefault(await getStorage(DEFAULT_SETTINGS));
  settings = { ...DEFAULT_SETTINGS, ...stored, domainOverrides: stored.domainOverrides || {}, siteSettings: stored.siteSettings || {} };
  settings.domainSelectors = stored.domainSelectors || {};
  await populateSystemFonts();
  applyControls();
}

toggleGlobal.addEventListener('change', event => {
  save({ globalEnabled: event.target.checked });
});

toggleDomain.addEventListener('change', event => {
  if (!activeDomain) {
    return;
  }

  const domainOverrides = { ...settings.domainOverrides, [activeDomain]: event.target.checked };
  save({ domainOverrides });
});

toggleRelativeGlobal.addEventListener('change', event => {
  const values = { convertRelativeTimes: event.target.checked };

  if (activeDomain) {
    values.siteSettings = {
      ...settings.siteSettings,
      [activeDomain]: {
        ...(settings.siteSettings?.[activeDomain] || {}),
        convertRelativeTimes: event.target.checked
      }
    };
  }

  save(values);
});

openOptionsButton.addEventListener('click', async () => {
  if (activeDomain) {
    await setStorage({ lastOptionsDomain: activeDomain });
  }

  if (api.runtime.openOptionsPage) {
    api.runtime.openOptionsPage();
    return;
  }

  api.tabs.create({ url: api.runtime.getURL('src/options/options.html') });
});

openAboutButton.addEventListener('click', async () => {
  if (activeDomain) {
    await setStorage({ lastOptionsDomain: activeDomain });
  }

  api.tabs.create({ url: `${api.runtime.getURL('src/options/options.html')}#about` });
});

startPickerButton.addEventListener('click', () => {
  sendActiveTabMessage({ type: 'JDC_START_PICKER' });
  showStatus(tr('popup.pickStatus', 'روی تاریخ موردنظر در صفحه کلیک کنید.'));
  window.close();
});

saveQuickSiteButton.addEventListener('click', () => {
  if (!activeDomain) {
    return;
  }

  const siteSettings = {
    ...settings.siteSettings,
    [activeDomain]: {
      ...(settings.siteSettings?.[activeDomain] || {}),
      ...getQuickPayload()
    }
  };

  save({ siteSettings });
});

resetQuickSiteButton.addEventListener('click', () => {
  applyControls();
  notifyActiveTab();
  showStatus(tr('popup.resetStatus', 'تنظیمات سریع به مقدار ذخیره‌شده برگشت.'));
});

loadQuickSystemFonts.addEventListener('click', async () => {
  await populateSystemFonts();
  applyControls();
  showStatus(tr('font.loadedStatus', 'فونت‌های سیستم بارگذاری شد.'));
});

[
  quickFont,
  quickFontSize,
  quickConvertRelativeTimes,
  quickDirection,
  quickAlign,
  quickDateMode,
  quickCalendarSystem,
  quickCustomDate,
  quickTimeFormat,
  quickNumberMode,
  quickOutputLocale
].forEach(control => {
  control.addEventListener('input', previewQuickSettings);
  control.addEventListener('change', previewQuickSettings);
});

init();
