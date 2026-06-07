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
  lastOptionsDomain: '',
  siteSettings: {},
  domainSelectors: {},
  domainOverrides: {},
  relativeDefaultMigrated: false,
  relativeDefaultVersion: 0
};
const RELATIVE_DEFAULT_VERSION = 2;
const LANGUAGE_DEFAULTS = {
  fa: {
    calendarSystem: 'jalali',
    outputLocale: 'fa-IR'
  },
  ur: {
    calendarSystem: 'jalali',
    outputLocale: 'ur-PK'
  },
  ar: {
    calendarSystem: 'hijri',
    outputLocale: 'ar-SA'
  },
  en: {
    calendarSystem: DEFAULT_SETTINGS.calendarSystem,
    outputLocale: DEFAULT_SETTINGS.outputLocale
  }
};

const api = chrome;
const form = document.getElementById('settingsForm');
const uiLanguage = document.getElementById('uiLanguage');
const languageModal = document.getElementById('languageModal');
const firstRunLanguage = document.getElementById('firstRunLanguage');
const saveFirstRunLanguage = document.getElementById('saveFirstRunLanguage');
const settingsScope = document.getElementById('settingsScope');
const currentDomainLabel = document.getElementById('currentDomainLabel');
const globalEnabled = document.getElementById('globalEnabled');
const convertDates = document.getElementById('convertDates');
const convertTimes = document.getElementById('convertTimes');
const convertRelativeTimes = document.getElementById('convertRelativeTimes');
const timeZone = document.getElementById('timeZone');
const sourceTimeZone = document.getElementById('sourceTimeZone');
const calendarSystem = document.getElementById('calendarSystem');
const dateFormatMode = document.getElementById('dateFormatMode');
const customDateFormat = document.getElementById('customDateFormat');
const timeFormat = document.getElementById('timeFormat');
const outputLocale = document.getElementById('outputLocale');
const directionMode = document.getElementById('directionMode');
const textAlignMode = document.getElementById('textAlignMode');
const numberMode = document.getElementById('numberMode');
const fontFamily = document.getElementById('fontFamily');
const loadSystemFonts = document.getElementById('loadSystemFonts');
const fontSize = document.getElementById('fontSize');
const manualSelector = document.getElementById('manualSelector');
const domainList = document.getElementById('domainList');
const selectorList = document.getElementById('selectorList');
const statusText = document.getElementById('statusText');
const resetButton = document.getElementById('resetSettings');
const liveDemo = document.getElementById('liveDemo');
const copyrightYear = document.getElementById('copyrightYear');

let settings = { ...DEFAULT_SETTINGS };
let activeDomain = '';
let i18nState = { language: 'fa', firstRunLanguage: false };

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

function queryTabs(query) {
  return promisify(resolve => api.tabs.query(query, resolve));
}

function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith('http') ? parsed.hostname : '';
  } catch (error) {
    return '';
  }
}

async function getActiveDomain() {
  const tabs = await queryTabs({ active: true, currentWindow: true });
  return getDomain(tabs[0]?.url || '');
}

function showStatus(message) {
  statusText.textContent = message;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    statusText.textContent = '';
  }, 2200);
}

function toArabicDigits(value) {
  const english = '0123456789';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  return String(value).replace(/[0-9]/g, digit => arabic[english.indexOf(digit)]);
}

function applyDemoNumberMode(value, mode) {
  const english = '0123456789';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  const text = String(value);

  if (mode === 'enToFa') {
    return text.replace(/[0-9]/g, digit => persian[english.indexOf(digit)]);
  }

  if (mode === 'faToEn') {
    return text.replace(/[۰-۹]/g, digit => String(persian.indexOf(digit)));
  }

  if (mode === 'enToAr') {
    return text.replace(/[0-9]/g, digit => arabic[english.indexOf(digit)]);
  }

  if (mode === 'faToAr') {
    return text.replace(/[۰-۹]/g, digit => arabic[persian.indexOf(digit)]);
  }

  if (mode === 'arToFa') {
    return text.replace(/[٠-٩]/g, digit => persian[arabic.indexOf(digit)]);
  }

  if (mode === 'arToEn') {
    return text.replace(/[٠-٩]/g, digit => String(arabic.indexOf(digit)));
  }

  return text;
}

function getPersianYear() {
  try {
    return new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric'
    }).format(new Date()).replace(/\D/g, '');
  } catch (error) {
    return '1405';
  }
}

function updateCopyrightYear() {
  if (!copyrightYear) {
    return;
  }

  const language = settings.uiLanguage || i18nState.language;

  if (language === 'en') {
    copyrightYear.textContent = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(new Date());
    return;
  }

  const persianYear = getPersianYear();

  if (language === 'ar') {
    copyrightYear.textContent = toArabicDigits(persianYear);
    return;
  }

  copyrightYear.textContent = persianYear;
}

function applyLanguageDefaultsToForm(language) {
  const defaults = LANGUAGE_DEFAULTS[language] || LANGUAGE_DEFAULTS.fa;
  calendarSystem.value = defaults.calendarSystem;
  outputLocale.value = defaults.outputLocale;
}

function getLanguageDefaultPayload(language) {
  const defaults = LANGUAGE_DEFAULTS[language] || LANGUAGE_DEFAULTS.fa;
  return {
    calendarSystem: defaults.calendarSystem,
    outputLocale: defaults.outputLocale
  };
}

function fillForm() {
  const activeValues = settingsScope.value === 'site' && activeDomain
    ? { ...settings, ...(settings.siteSettings[activeDomain] || {}) }
    : settings;

  uiLanguage.value = settings.uiLanguage || i18nState.language;
  currentDomainLabel.textContent = activeDomain
    ? `${tr('domain.current', 'سایت فعلی')}: ${activeDomain}`
    : tr('domain.unknown', 'سایت فعلی قابل تشخیص نیست');
  globalEnabled.checked = settings.globalEnabled;
  convertDates.checked = activeValues.convertDates;
  convertTimes.checked = activeValues.convertTimes;
  convertRelativeTimes.checked = activeValues.convertRelativeTimes;
  timeZone.value = activeValues.timeZone;
  sourceTimeZone.value = activeValues.sourceTimeZone;
  calendarSystem.value = activeValues.calendarSystem;
  dateFormatMode.value = activeValues.dateFormatMode;
  customDateFormat.value = activeValues.customDateFormat;
  timeFormat.value = activeValues.timeFormat;
  outputLocale.value = activeValues.outputLocale;
  directionMode.value = activeValues.directionMode;
  textAlignMode.value = activeValues.textAlignMode;
  numberMode.value = activeValues.numberMode;
  fontFamily.value = activeValues.fontFamily;
  fontSize.value = activeValues.fontSize;
  manualSelector.value = activeValues.manualSelector;
  renderDomains();
  renderSelectors();
  updateCopyrightYear();
  updateDemo();
}

async function populateSystemFonts() {
  await window.JDC_SYSTEM_FONTS?.populateFontSelect(fontFamily, {
    defaultLabel: tr('option.siteFont', 'فونت سایت'),
    installedLabel: tr('font.installedGroup', 'فونت‌های نصب‌شده روی سیستم'),
    fallbackLabel: tr('font.fallbackGroup', 'فونت‌های عمومی سیستم'),
    selectedValues: [
      settings.fontFamily,
      ...Object.values(settings.siteSettings || {}).map(values => values?.fontFamily)
    ]
  });
}

function renderDomains() {
  const entries = Object.entries({
    ...settings.domainOverrides,
    ...Object.fromEntries(Object.keys(settings.siteSettings || {}).map(domain => [domain, true]))
  });
  domainList.textContent = '';

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'help';
    empty.textContent = tr('domains.empty', 'هنوز تنظیم اختصاصی برای دامنه‌ای ذخیره نشده است.');
    domainList.append(empty);
    return;
  }

  for (const [domain, enabled] of entries.sort()) {
    const row = document.createElement('div');
    row.className = 'domain-item';

    const label = document.createElement('span');
    label.textContent = `${domain} : ${enabled ? tr('state.enabled', 'فعال') : tr('state.disabled', 'غیرفعال')}`;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = tr('action.remove', 'حذف');
    remove.addEventListener('click', () => removeDomain(domain));

    row.append(label, remove);
    domainList.append(row);
  }
}

function renderSelectors() {
  selectorList.textContent = '';

  const entries = Object.entries(settings.domainSelectors || {}).filter(([, selectors]) => selectors.length);

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'help';
    empty.textContent = tr('selectors.empty', 'هنوز selector انتخابی ذخیره نشده است.');
    selectorList.append(empty);
    return;
  }

  for (const [domain, selectors] of entries.sort()) {
    const details = document.createElement('details');
    details.className = 'selector-domain';
    details.open = domain === activeDomain;

    const summary = document.createElement('summary');
    summary.textContent = `${domain} (${selectors.length} selector)`;

    const actions = document.createElement('div');
    actions.className = 'selector-actions';

    const removeAll = document.createElement('button');
    removeAll.type = 'button';
    removeAll.textContent = tr('selectors.removeAll', 'حذف همه selectorهای دامنه');
    removeAll.addEventListener('click', () => removeAllSelectors(domain));
    actions.append(removeAll);

    const items = document.createElement('div');
    items.className = 'selector-items';

    for (const selector of [...new Set(selectors)].sort()) {
      const row = document.createElement('div');
      row.className = 'domain-item selector-item';

      const label = document.createElement('code');
      label.textContent = selector;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = tr('action.remove', 'حذف');
      remove.addEventListener('click', () => removeSelector(domain, selector));

      row.append(label, remove);
      items.append(row);
    }

    details.append(summary, actions, items);
    selectorList.append(details);
  }
}

async function notifyTabs() {
  const tabs = await queryTabs({ url: ['http://*/*', 'https://*/*'] });

  for (const tab of tabs) {
    if (!tab.id) {
      continue;
    }

    api.tabs.sendMessage(tab.id, { type: 'JDC_SETTINGS_CHANGED' }, () => {
      chrome.runtime.lastError;
    });
  }
}

async function saveSettings(nextSettings) {
  settings = { ...settings, ...nextSettings };
  await setStorage(nextSettings);
  await notifyTabs();
  fillForm();
  showStatus(tr('status.saved', 'تنظیمات ذخیره شد.'));
}

function collectForm() {
  return {
    convertDates: convertDates.checked,
    convertTimes: convertTimes.checked,
    convertRelativeTimes: convertRelativeTimes.checked,
    timeZone: timeZone.value,
    sourceTimeZone: sourceTimeZone.value,
    calendarSystem: calendarSystem.value,
    dateFormatMode: dateFormatMode.value,
    customDateFormat: customDateFormat.value.trim() || DEFAULT_SETTINGS.customDateFormat,
    timeFormat: timeFormat.value,
    outputLocale: outputLocale.value,
    directionMode: directionMode.value,
    textAlignMode: textAlignMode.value,
    numberMode: numberMode.value,
    fontFamily: fontFamily.value,
    fontSize: fontSize.value,
    manualSelector: manualSelector.value.trim()
  };
}

async function removeSelector(domain, selector) {
  const domainSelectors = { ...settings.domainSelectors };
  domainSelectors[domain] = (domainSelectors[domain] || []).filter(value => value !== selector);

  if (!domainSelectors[domain].length) {
    delete domainSelectors[domain];
  }

  await saveSettings({ domainSelectors });
}

async function removeAllSelectors(domain) {
  const domainSelectors = { ...settings.domainSelectors };
  delete domainSelectors[domain];
  await saveSettings({ domainSelectors });
}

function collectSavePayload() {
  const fields = collectForm();

  if (settingsScope.value === 'site' && activeDomain) {
    return {
      uiLanguage: uiLanguage.value,
      siteSettings: {
        ...settings.siteSettings,
        [activeDomain]: fields
      }
    };
  }

  return {
    globalEnabled: globalEnabled.checked,
    uiLanguage: uiLanguage.value,
    ...fields
  };
}

async function removeDomain(domain) {
  const domainOverrides = { ...settings.domainOverrides };
  const siteSettings = { ...settings.siteSettings };
  delete domainOverrides[domain];
  delete siteSettings[domain];
  await saveSettings({ domainOverrides, siteSettings });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  saveSettings(collectSavePayload());
});

resetButton.addEventListener('click', () => {
  saveSettings({ ...DEFAULT_SETTINGS });
});

function updateDemo() {
  const values = collectForm();
  const font = values.fontFamily || 'Arial, sans-serif';
  const calendarLocales = i18nState.dictionary?.calendar?.locales || {};
  const activeLocale = values.calendarSystem === 'hijri' ? 'ar-SA' : values.outputLocale;
  const localeLabels = calendarLocales[activeLocale] || calendarLocales['fa-IR'] || {};
  const sampleMonth = values.calendarSystem === 'hijri'
    ? (calendarLocales['ar-SA']?.months?.[11] || 'ذو الحجة')
    : (localeLabels.months?.[2] || 'خرداد');
  const sampleWeekday = values.calendarSystem === 'hijri'
    ? (calendarLocales['ar-SA']?.weekdays?.[0] || 'الأحد')
    : (localeLabels.weekdays?.[0] || 'یکشنبه');
  const date = values.dateFormatMode === 'custom'
    ? values.customDateFormat
      .replace(/YYYY/g, '1405')
      .replace(/YY/g, '05')
      .replace(/MMMM/g, sampleMonth)
      .replace(/MM/g, '03')
      .replace(/M/g, '3')
      .replace(/DD/g, '03')
      .replace(/D/g, '3')
    : values.calendarSystem === 'hijri' ? '18 ذو الحجة 1447' : `3 ${sampleMonth} 1405`;
  const time = values.convertTimes
    ? (values.timeFormat.startsWith('24h') ? '21:15:09' : '9:15:09 ب.ظ')
    : '6:45 ب.ظ';
  const isoTime = values.convertTimes ? '21:15:09' : '18:45:09';
  const textDate = values.calendarSystem === 'hijri' ? 'ذو الحجة 18، 1447' : `${sampleMonth} 3، 1405`;
  const relativeTime = values.convertRelativeTimes ? tr('relative.previewConverted', '5 سال پیش') : tr('relative.preview', '5 years ago');
  const persianSample = `امروز ${sampleWeekday} 3 ${sampleMonth} 1405 است.`;
  const renderNumber = value => applyDemoNumberMode(value, values.numberMode);

  liveDemo.style.fontFamily = font;
  liveDemo.style.fontSize = values.fontSize || '';
  liveDemo.style.direction = values.directionMode === 'inherit' ? 'rtl' : values.directionMode;
  liveDemo.style.textAlign = values.textAlignMode === 'inherit' ? 'right' : values.textAlignMode;
  liveDemo.innerHTML = `
    <p class="demo-title">${renderNumber(`${sampleWeekday}، ${date} ${time}`)}</p>
    <p>${tr('demo.isoLabel', 'ISO')}: ${renderNumber(`${date}T${isoTime}+02:00`)}</p>
    <p>${tr('demo.numericLabel', 'Numeric')}: ${renderNumber(`${date} ${time}`)}</p>
    <p>${tr('demo.textLabel', 'Text')}: ${renderNumber(textDate)}</p>
    <p>${tr('relative.previewLabel', 'Relative time')}: ${renderNumber(relativeTime)}</p>
    <p>${tr('demo.fontSample', 'Font sample')}: ZamanYar</p>
    <p>${tr('demo.persianSample', 'نمونه فارسی')}: ${renderNumber(persianSample)}</p>
  `;
}

form.addEventListener('input', updateDemo);
form.addEventListener('change', event => {
  if (event.target === settingsScope) {
    fillForm();
    return;
  }

  updateDemo();
});

async function init() {
  i18nState = await window.JDC_I18N.initI18n();
  const stored = await migrateRelativeDefault(await getStorage(DEFAULT_SETTINGS));
  activeDomain = stored.lastOptionsDomain || await getActiveDomain();
  settings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    domainOverrides: stored.domainOverrides || {},
    siteSettings: stored.siteSettings || {},
    domainSelectors: stored.domainSelectors || {}
  };
  if (!settings.uiLanguage) {
    settings.uiLanguage = i18nState.language;
  }
  await populateSystemFonts();
  fillForm();

  if (i18nState.firstRunLanguage) {
    firstRunLanguage.value = settings.uiLanguage;
    languageModal.hidden = false;
  }
}

init();

uiLanguage.addEventListener('change', async event => {
  const language = event.target.value;
  await window.JDC_I18N.changeLanguage(language);
  i18nState = { ...i18nState, language, dictionary: window.JDC_I18N.dictionary };
  const languageDefaults = getLanguageDefaultPayload(language);
  settings = { ...settings, uiLanguage: language, ...languageDefaults };
  applyLanguageDefaultsToForm(language);
  await populateSystemFonts();
  await setStorage({ uiLanguage: language, firstRunLanguage: false, ...languageDefaults });
  fillForm();
});

saveFirstRunLanguage.addEventListener('click', async () => {
  const language = firstRunLanguage.value;
  await window.JDC_I18N.changeLanguage(language);
  i18nState = { ...i18nState, language, dictionary: window.JDC_I18N.dictionary };
  const languageDefaults = getLanguageDefaultPayload(language);
  settings = { ...settings, uiLanguage: language, ...languageDefaults };
  uiLanguage.value = language;
  applyLanguageDefaultsToForm(language);
  languageModal.hidden = true;
  await populateSystemFonts();
  await setStorage({ uiLanguage: language, firstRunLanguage: false, ...languageDefaults });
  fillForm();
});

loadSystemFonts.addEventListener('click', async () => {
  await populateSystemFonts();
  fillForm();
});
