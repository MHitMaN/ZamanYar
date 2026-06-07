(() => {
  const SUPPORTED = ['fa', 'ur', 'ar', 'en'];
  const RTL = new Set(['fa', 'ur', 'ar']);
  const DEFAULT_LANGUAGE = 'fa';

  let dictionary = {};
  let currentLanguage = DEFAULT_LANGUAGE;

  function getBrowserLanguage() {
    const base = String(navigator.language || '').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(base) ? base : DEFAULT_LANGUAGE;
  }

  function getStorage(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }

  function setStorage(values) {
    return new Promise(resolve => chrome.storage.local.set(values, resolve));
  }

  async function loadDictionary(language) {
    const selected = SUPPORTED.includes(language) ? language : DEFAULT_LANGUAGE;
    const response = await fetch(chrome.runtime.getURL(`Languages/${selected}.json`));
    dictionary = await response.json();
    currentLanguage = selected;
    return dictionary;
  }

  function t(key, fallback = '') {
    return dictionary[key] || fallback || key;
  }

  function applyDocumentDirection(language = currentLanguage) {
    document.documentElement.lang = language;
    document.documentElement.dir = RTL.has(language) ? 'rtl' : 'ltr';
  }

  function applyTranslations(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.dataset.i18n, element.textContent);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder, element.getAttribute('placeholder') || ''));
    });

    root.querySelectorAll('[data-i18n-title]').forEach(element => {
      element.setAttribute('title', t(element.dataset.i18nTitle, element.getAttribute('title') || ''));
    });
  }

  async function initI18n() {
    const stored = await getStorage({ uiLanguage: '', firstRunLanguage: false });
    const language = stored.uiLanguage || getBrowserLanguage();
    await loadDictionary(language);
    applyDocumentDirection(language);
    applyTranslations();
    return { language, firstRunLanguage: stored.firstRunLanguage, dictionary };
  }

  async function changeLanguage(language) {
    const selected = SUPPORTED.includes(language) ? language : DEFAULT_LANGUAGE;
    await setStorage({ uiLanguage: selected, firstRunLanguage: false });
    await loadDictionary(selected);
    applyDocumentDirection(selected);
    applyTranslations();
    window.dispatchEvent(new CustomEvent('jdc:i18n-changed', { detail: { language: selected } }));
  }

  window.JDC_I18N = {
    SUPPORTED,
    RTL,
    t,
    initI18n,
    changeLanguage,
    get dictionary() {
      return dictionary;
    },
    get currentLanguage() {
      return currentLanguage;
    }
  };
})();
