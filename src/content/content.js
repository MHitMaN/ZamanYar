(() => {
  if (window.__jalaliDateConverterPro) {
    window.__jalaliDateConverterPro.refresh();
    return;
  }

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
  const originalText = new WeakMap();
  const renderedText = new WeakMap();
  const originalAttributes = new WeakMap();
  const renderedAttributes = new WeakMap();
  const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'TEXTAREA',
    'INPUT',
    'SELECT',
    'OPTION',
    'CODE',
    'PRE',
    'KBD',
    'SAMP'
  ]);
  const DATEPICKER_SELECTOR = [
    '.datepicker',
    '.date-picker',
    '.ui-datepicker',
    '.flatpickr-calendar',
    '.react-datepicker',
    '.ant-picker',
    '.ant-picker-dropdown',
    '.MuiDateCalendar-root',
    '.MuiPickersPopper-root',
    '.pika-single',
    '.air-datepicker',
    '.daterangepicker',
    '[data-datepicker]',
    '[data-date-picker]',
    '[role="grid"][aria-label*="calendar" i]',
    '[role="dialog"][aria-label*="calendar" i]'
  ].join(',');
  const MONTHS = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12
  };
  const DEFAULT_CALENDAR_LOCALES = {};
  const WEEKDAY_INDEX_MAP = {
    sun: 0,
    sunday: 0,
    su: 0,
    mon: 1,
    monday: 1,
    mo: 1,
    tue: 2,
    tuesday: 2,
    tu: 2,
    wed: 3,
    wednesday: 3,
    we: 3,
    thu: 4,
    thr: 4,
    thrisday: 4,
    thursday: 4,
    th: 4,
    fri: 5,
    friday: 5,
    fr: 5,
    sat: 6,
    saturday: 6,
    sa: 6
  };
  function getCalendarLabels() {
    if (settings.calendarSystem === 'hijri') {
      return calendarLocales['ar-SA'] || { months: [], weekdays: [] };
    }

    return calendarLocales[settings.outputLocale] || calendarLocales['fa-IR'] || { months: [], weekdays: [] };
  }

  let observer = null;
  let observedShadowRoots = new WeakSet();
  let settings = { ...DEFAULT_SETTINGS };
  let calendarLocales = DEFAULT_CALENDAR_LOCALES;
  let relativeLabels = {};
  let picker = null;
  let processScheduled = false;
  let fullRescanTimer = 0;
  const startupScanTimers = [];
  const mutationScanTimers = [];
  const relativeHealTimers = [];
  const pendingRoots = new Set();
  const MUTATION_OBSERVER_OPTIONS = {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['datetime', 'title', 'aria-label', 'data-tooltip', 'data-original-title', 'data-date', 'data-time', 'data-testid']
  };
  const TRANSFORMABLE_ATTRIBUTES = ['title', 'aria-label', 'data-tooltip', 'data-original-title'];
  const ICON_SELECTOR = [
    'svg',
    'svg *',
    'img',
    'canvas',
    '[aria-hidden="true"]',
    '[role="img"]',
    '[class*="icon" i]',
    '[class*="material" i]',
    '[class^="fa-"]',
    '[class*=" fa-"]',
    '[class*="dashicons" i]',
    '[class*="glyphicon" i]',
    '[class*="symbol" i]'
  ].join(',');
  const RELATIVE_TIME_UNIT_PATTERN = 'years?|yrs?|months?|mos?|weeks?|wks?|days?|hours?|hrs?|minutes?|mins?|seconds?|secs?';
  const RELATIVE_UNIT_MAP = {
    year: 'year',
    years: 'year',
    yr: 'year',
    yrs: 'year',
    month: 'month',
    months: 'month',
    mo: 'month',
    mos: 'month',
    week: 'week',
    weeks: 'week',
    wk: 'week',
    wks: 'week',
    day: 'day',
    days: 'day',
    d: 'day',
    hour: 'hour',
    hours: 'hour',
    hr: 'hour',
    hrs: 'hour',
    minute: 'minute',
    minutes: 'minute',
    min: 'minute',
    mins: 'minute',
    second: 'second',
    seconds: 'second',
    sec: 'second',
    secs: 'second'
  };
  const RELATIVE_METADATA_SELECTOR = [
    '[class*="metadata" i]',
    '[class*="ytAttributedString" i]',
    '[class*="contentMetadata" i]',
    '[class*="MetadataText" i]',
    '[class*="published" i]',
    '[class*="date" i]',
    '[class*="time" i]',
    'yt-formatted-string',
    'time',
    'relative-time'
  ].join(',');

  function getStorage(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  function setStorage(values) {
    return new Promise(resolve => {
      chrome.storage.local.set(values, resolve);
    });
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

  async function loadLanguageData(language = 'fa') {
    const supported = new Set(['fa', 'ur', 'ar', 'en']);
    const selected = supported.has(language) ? language : 'fa';

    try {
      const response = await fetch(chrome.runtime.getURL(`Languages/${selected}.json`));
      const dictionary = await response.json();
      const locales = dictionary.calendar?.locales;

      if (locales && typeof locales === 'object') {
        calendarLocales = { ...DEFAULT_CALENDAR_LOCALES, ...locales };
      }

      relativeLabels = dictionary.relative || {};
    } catch (error) {
      calendarLocales = DEFAULT_CALENDAR_LOCALES;
      relativeLabels = {};
    }
  }

  function getDomain() {
    return window.location.hostname;
  }

  function getEffectiveSettings(stored) {
    const base = { ...DEFAULT_SETTINGS, ...stored };
    const domainSettings = base.siteSettings?.[getDomain()] || {};
    return {
      ...base,
      ...domainSettings,
      siteSettings: base.siteSettings || {},
      domainSelectors: base.domainSelectors || {},
      domainOverrides: base.domainOverrides || {}
    };
  }

  function isEnabledForThisDomain() {
    const override = settings.domainOverrides?.[getDomain()];
    return typeof override === 'boolean' ? override : settings.globalEnabled;
  }

  function gregorianToJalali(gy, gm, gd) {
    if (window.jalaali?.toJalaali) {
      return window.jalaali.toJalaali(gy, gm, gd);
    }

    const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy;

    if (gy > 1600) {
      jy = 979;
      gy -= 1600;
    } else {
      jy = 0;
      gy -= 621;
    }

    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 365 * gy
      + Math.floor((gy2 + 3) / 4)
      - Math.floor((gy2 + 99) / 100)
      + Math.floor((gy2 + 399) / 400)
      - 80
      + gd
      + gdm[gm - 1];

    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = days < 186 ? 1 + (days % 31) : 1 + ((days - 186) % 30);
    return { jy, jm, jd };
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function normalizeDigits(value) {
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    const arabic = '٠١٢٣٤٥٦٧٨٩';
    return String(value).replace(/[۰-۹٠-٩]/g, digit => {
      const persianIndex = persian.indexOf(digit);
      return persianIndex >= 0 ? String(persianIndex) : String(arabic.indexOf(digit));
    });
  }

  function toInt(value) {
    return Number.parseInt(normalizeDigits(value), 10);
  }

  function getGregorianMonth(value) {
    return MONTHS[String(value || '').toLowerCase().replace(/\./g, '')] || 0;
  }

  function isValidGregorian(gy, gm, gd) {
    if (gy < 1600 || gy > 2200 || gm < 1 || gm > 12 || gd < 1 || gd > 31) {
      return false;
    }

    const date = new Date(Date.UTC(gy, gm - 1, gd));
    return date.getUTCFullYear() === gy
      && date.getUTCMonth() === gm - 1
      && date.getUTCDate() === gd;
  }

  function getJalaliParts(gy, gm, gd) {
    if (!isValidGregorian(gy, gm, gd)) {
      return null;
    }

    return gregorianToJalali(gy, gm, gd);
  }

  function getHijriParts(gy, gm, gd) {
    if (!isValidGregorian(gy, gm, gd)) {
      return null;
    }

    try {
      const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).formatToParts(new Date(Date.UTC(gy, gm - 1, gd)));
      const value = type => Number.parseInt(parts.find(part => part.type === type)?.value || '', 10);
      const jy = value('year');
      const jm = value('month');
      const jd = value('day');
      return jy && jm && jd ? { jy, jm, jd } : null;
    } catch (error) {
      return null;
    }
  }

  function getCalendarParts(gy, gm, gd) {
    return settings.calendarSystem === 'hijri'
      ? getHijriParts(gy, gm, gd)
      : getJalaliParts(gy, gm, gd);
  }

  function getCustomDate(parts) {
    if (settings.dateFormatMode !== 'custom' || !settings.customDateFormat.trim()) {
      return '';
    }

    return settings.customDateFormat
      .replace(/YYYY/g, String(parts.jy))
      .replace(/YY/g, String(parts.jy).slice(-2))
      .replace(/MMMM/g, getMonthName(parts.jm))
      .replace(/MM/g, pad(parts.jm))
      .replace(/M/g, String(parts.jm))
      .replace(/DD/g, pad(parts.jd))
      .replace(/D/g, String(parts.jd));
  }

  function formatNumeric(parts, order, separator) {
    const custom = getCustomDate(parts);

    if (custom) {
      return custom;
    }

    const values = {
      y: String(parts.jy),
      m: pad(parts.jm),
      d: pad(parts.jd)
    };

    return order.map(key => values[key]).join(separator);
  }

  function getDateInTimeZone(date) {
    const timeZone = settings.timeZone === 'local'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : settings.timeZone;

    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(date);
      const value = type => parts.find(part => part.type === type)?.value || '00';

      return {
        gy: Number(value('year')),
        gm: Number(value('month')),
        gd: Number(value('day')),
        hour: value('hour') === '24' ? '00' : value('hour'),
        minute: value('minute'),
        second: value('second')
      };
    } catch (error) {
      return {
        gy: date.getFullYear(),
        gm: date.getMonth() + 1,
        gd: date.getDate(),
        hour: pad(date.getHours()),
        minute: pad(date.getMinutes()),
        second: pad(date.getSeconds())
      };
    }
  }

  function getResolvedTimeZone(timeZone) {
    return timeZone === 'local'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : timeZone;
  }

  function getTimeZoneOffsetMinutes(timeZone, date) {
    if (timeZone === 'UTC') {
      return 0;
    }

    if (timeZone === 'local') {
      return -date.getTimezoneOffset();
    }

    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: getResolvedTimeZone(timeZone),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(date);
      const value = type => Number(parts.find(part => part.type === type)?.value || 0);
      const asUtc = Date.UTC(
        value('year'),
        value('month') - 1,
        value('day'),
        value('hour') === 24 ? 0 : value('hour'),
        value('minute'),
        value('second')
      );

      return Math.round((asUtc - date.getTime()) / 60000);
    } catch (error) {
      return 0;
    }
  }

  function getTargetOffsetDelta(date) {
    const sourceOffset = getTimeZoneOffsetMinutes(settings.sourceTimeZone || 'UTC', date);
    const targetOffset = getTimeZoneOffsetMinutes(settings.timeZone || 'Asia/Tehran', date);
    return targetOffset - sourceOffset;
  }

  const MONTH_NAME_SOURCE = 'Jan(?:uary)?\\.?|Feb(?:ruary)?\\.?|Mar(?:ch)?\\.?|Apr(?:il)?\\.?|May\\.?|Jun(?:e)?\\.?|Jul(?:y)?\\.?|Aug(?:ust)?\\.?|Sep(?:t\\.?|tember)?\\.?|Oct(?:ober)?\\.?|Nov(?:ember)?\\.?|Dec(?:ember)?\\.?';

  function getMeridiemLabel(isAm) {
    if (settings.outputLocale === 'ar-SA') {
      return isAm ? 'ص' : 'م';
    }

    if (settings.outputLocale === 'en-US') {
      return isAm ? 'AM' : 'PM';
    }

    return isAm ? 'ق.ظ' : 'ب.ظ';
  }

  function toPersianMeridiem(meridiem) {
    return getMeridiemLabel(/^a/i.test(meridiem));
  }

  function formatStandaloneTime(hour24, minute, second, hasSeconds) {
    const normalizedHour = ((hour24 % 24) + 24) % 24;
    const showSeconds = hasSeconds || settings.timeFormat === '24h-seconds';

    if (settings.timeFormat === '24h' || settings.timeFormat === '24h-seconds') {
      return `${pad(normalizedHour)}:${pad(minute)}${showSeconds ? `:${pad(second)}` : ''}`;
    }

    const hour12 = normalizedHour % 12 || 12;
    const meridiem = getMeridiemLabel(normalizedHour < 12);
    return `${hour12}:${pad(minute)}${hasSeconds ? `:${pad(second)}` : ''} ${meridiem}`;
  }

  function convertStandaloneTimes(text) {
    const digit = '[0-9۰-۹٠-٩]';
    const noDigitBefore = `(?<!${digit})`;
    const noDigitAfter = `(?!${digit})`;
    const meridiem = '(a\\.?m\\.?|p\\.?m\\.?)';

    return text.replace(
      new RegExp(`${noDigitBefore}(${digit}{1,2}):(${digit}{2})(?::(${digit}{2}))?\\s*${meridiem}${noDigitAfter}`, 'gi'),
      (match, hourText, minuteText, secondText = '', meridiemText) => {
        let hour = toInt(hourText);
        const minute = toInt(minuteText);
        const second = secondText ? toInt(secondText) : 0;

        if (hour < 1 || hour > 12 || minute > 59 || second > 59) {
          return match;
        }

        const isPm = /^p/i.test(meridiemText);
        hour = (hour % 12) + (isPm ? 12 : 0);

        if (!settings.convertTimes) {
          return `${toInt(hourText)}:${pad(minute)}${secondText ? `:${pad(second)}` : ''} ${toPersianMeridiem(meridiemText)}`;
        }

        const referenceDate = new Date();
        const totalMinutes = (hour * 60) + minute + getTargetOffsetDelta(referenceDate);
        const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
        const convertedHour = Math.floor(normalizedMinutes / 60);
        const convertedMinute = normalizedMinutes % 60;
        return formatStandaloneTime(convertedHour, convertedMinute, second, Boolean(secondText));
      }
    );
  }

  function localizeWeekdayNames(text) {
    const labels = getCalendarLabels();
    const withTwoLetterDays = text.replace(/\b(Su|Mo|Tu|We|Th|Fr|Sa)\b/g, weekday => {
      const index = WEEKDAY_INDEX_MAP[weekday.toLowerCase()];
      return typeof index === 'number' ? labels.weekdays[index] || weekday : weekday;
    });

    return withTwoLetterDays.replace(/\b(Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Thrisday|Thr|Fri(?:day)?|Sat(?:urday)?)\b/gi, weekday => {
      const index = WEEKDAY_INDEX_MAP[weekday.toLowerCase()];
      return typeof index === 'number' ? labels.weekdays[index] || weekday : weekday;
    });
  }

  function localizeStandaloneMonthName(text) {
    const normalized = String(text || '').trim();
    const match = normalized.match(new RegExp(`^(${MONTH_NAME_SOURCE})$`, 'i'));

    if (!match) {
      return text;
    }

    const month = getGregorianMonth(match[1]);
    const parts = getCalendarParts(new Date().getFullYear(), month, 1);
    return parts ? getMonthName(parts.jm) : text;
  }

  function parseDateWithOptionalTime(gy, gm, gd, timeText = '', zoneText = '') {
    if (!timeText || !isValidGregorian(gy, gm, gd)) {
      return { gy, gm, gd, time: timeText || '', zone: zoneText || '' };
    }

    const parts = normalizeDigits(timeText).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?/);

    if (!parts) {
      return { gy, gm, gd, time: timeText, zone: zoneText || '' };
    }

    const hour = Number(parts[1]);
    const minute = Number(parts[2]);
    const second = Number(parts[3] || 0);
    const millisecond = Number(String(parts[4] || '0').padEnd(3, '0').slice(0, 3));
    let sourceDate;

    const normalizedZoneText = String(zoneText || '').replace(/^(GMT|UTC)/i, '');

    if (normalizedZoneText === 'Z') {
      sourceDate = new Date(Date.UTC(gy, gm - 1, gd, hour, minute, second, millisecond));
    } else if (/^[+-]/.test(normalizedZoneText)) {
      const normalizedZone = normalizeDigits(normalizedZoneText).replace(':', '');
      const sign = normalizedZone.startsWith('-') ? -1 : 1;
      const zoneHour = Number(normalizedZone.slice(1, 3));
      const zoneMinute = Number(normalizedZone.slice(3, 5) || 0);
      const offset = sign * ((zoneHour * 60) + zoneMinute);
      sourceDate = new Date(Date.UTC(gy, gm - 1, gd, hour, minute - offset, second, millisecond));
    } else {
      sourceDate = new Date(gy, gm - 1, gd, hour, minute, second, millisecond);
    }

    if (!settings.convertTimes) {
      return { gy, gm, gd, time: timeText, zone: zoneText || '' };
    }

    const zoned = getDateInTimeZone(sourceDate);
    const showSeconds = /:\d{2}:\d{2}/.test(timeText);
    return {
      gy: zoned.gy,
      gm: zoned.gm,
      gd: zoned.gd,
      time: `${zoned.hour}:${zoned.minute}${showSeconds ? `:${zoned.second}` : ''}`,
      zone: ''
    };
  }

  function getWeekdayFa(gy, gm, gd) {
    const labels = getCalendarLabels();
    return labels.weekdays[new Date(gy, gm - 1, gd).getDay()] || '';
  }

  function getMonthName(jm) {
    const labels = getCalendarLabels();
    return labels.months[jm - 1] || String(jm);
  }

  function formatPersianTextDate(parts, order = 'day-month-year') {
    const custom = getCustomDate(parts);

    if (custom) {
      return custom;
    }

    if (order === 'month-day-year') {
      return `${getMonthName(parts.jm)} ${parts.jd}، ${parts.jy}`;
    }

    return `${parts.jd} ${getMonthName(parts.jm)} ${parts.jy}`;
  }

  function formatPersianMonthYear(gregorianYear, gregorianMonth) {
    const first = getCalendarParts(gregorianYear, gregorianMonth, 1);
    const lastGregorianDay = new Date(Date.UTC(gregorianYear, gregorianMonth, 0)).getUTCDate();
    const last = getCalendarParts(gregorianYear, gregorianMonth, lastGregorianDay);

    if (!first || !last) {
      return '';
    }

    if (first.jy === last.jy && first.jm === last.jm) {
      return `${getMonthName(first.jm)} ${first.jy}`;
    }

    if (first.jy === last.jy) {
      return `${getMonthName(first.jm)}/${getMonthName(last.jm)} ${first.jy}`;
    }

    return `${getMonthName(first.jm)} ${first.jy}/${getMonthName(last.jm)} ${last.jy}`;
  }

  function formatDateTimeElement(date) {
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const parts = getCalendarParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

    if (!parts) {
      return '';
    }

    return formatPersianTextDate(parts, 'month-day-year');
  }

  function convertStandaloneYears(text, enabled) {
    if (!enabled) {
      return text;
    }

    const digit = '[0-9۰-۹٠-٩]';
    return text.replace(new RegExp(`(?<!${digit})(19${digit}{2}|20${digit}{2}|21${digit}{2}|۱۹${digit}{2}|۲۰${digit}{2}|۲۱${digit}{2}|١٩${digit}{2}|٢٠${digit}{2}|٢١${digit}{2})(?!${digit})`, 'g'), match => {
      const year = toInt(match);
      const parts = getCalendarParts(year, 7, 1);
      return parts ? String(parts.jy) : match;
    });
  }

  function convertRelativeTimeText(text) {
    if (!settings.convertRelativeTimes) {
      return text;
    }

    const digit = '[0-9۰-۹٠-٩]';

    return text.replace(
      new RegExp(`(^|[^A-Za-z0-9_])(${digit}+)\\s+(${RELATIVE_TIME_UNIT_PATTERN})\\s+ago\\b`, 'gi'),
      (match, prefix, value, unitText) => {
        return `${prefix}${formatRelativeTime(value, unitText)}`;
      }
    );
  }

  function formatRelativeTime(value, unitText) {
    const template = relativeLabels.past || '{value} {unit} پیش';
    const unit = getLocalizedRelativeUnit(unitText);
    return template
      .replace('{value}', value)
      .replace('{unit}', unit);
  }

  function getLocalizedRelativeUnit(unitText) {
    const units = relativeLabels.units || {};
    return units[RELATIVE_UNIT_MAP[unitText.toLowerCase()]] || unitText;
  }

  function formatDurationTime(value, unitText) {
    return `${value} ${getLocalizedRelativeUnit(unitText)}`;
  }

  function formatDurationTail(unitText) {
    return ` ${getLocalizedRelativeUnit(unitText)}`;
  }

  function formatRelativeTail(unitText) {
    const template = relativeLabels.past || '{value} {unit} پیش';
    const unit = getLocalizedRelativeUnit(unitText);

    if (!template.trim().startsWith('{value}')) {
      return ` ${unit}`;
    }

    return template
      .replace('{value}', '')
      .replace('{unit}', unit)
      .replace(/\s+/g, ' ');
  }

  function containsRelativeTime(text) {
    const digit = '[0-9۰-۹٠-٩]';
    return new RegExp(`(^|[^A-Za-z0-9_])${digit}+\\s+(${RELATIVE_TIME_UNIT_PATTERN})\\s+ago\\b`, 'i').test(text);
  }

  function getDurationTimeMatch(text) {
    const digit = '[0-9۰-۹٠-٩]';
    return String(text || '').match(new RegExp(`^(${digit}+)\\s+(${RELATIVE_TIME_UNIT_PATTERN})$`, 'i'));
  }

  function convertNumericDate(match, first, separator, second, third, timePrefix = '', timeText = '', zoneText = '') {
    const a = toInt(first);
    const b = toInt(second);
    const c = toInt(third);
    let gy;
    let gm;
    let gd;
    let order;

    if (String(a).length === 4) {
      gy = a;

      if (b > 12 && c <= 12) {
        gd = b;
        gm = c;
        order = ['y', 'd', 'm'];
      } else {
        gm = b;
        gd = c;
        order = ['y', 'm', 'd'];
      }
    } else {
      gy = c;

      if (a > 12 && b <= 12) {
        gd = a;
        gm = b;
        order = ['d', 'm', 'y'];
      } else if (b > 12 && a <= 12) {
        gm = a;
        gd = b;
        order = ['m', 'd', 'y'];
      } else {
        gd = a;
        gm = b;
        order = ['d', 'm', 'y'];
      }
    }

    const zoned = parseDateWithOptionalTime(gy, gm, gd, timeText, zoneText);
    const parts = getCalendarParts(zoned.gy, zoned.gm, zoned.gd);

    if (!parts) {
      return match;
    }

    const convertedDate = formatNumeric(parts, order, separator);
    return `${convertedDate}${timeText ? `${timePrefix}${zoned.time}${zoned.zone ? zoned.zone : ''}` : ''}`;
  }

  function convertDates(text) {
    const digit = '[0-9۰-۹٠-٩]';
    const year = `(?:19|20|21|۱۹|۲۰|۲۱|١٩|٢٠|٢١)${digit}{2}`;
    const shortYear = `${digit}{2}`;
    const noDigitBefore = `(?<!${digit})`;
    const noDigitAfter = `(?!${digit})`;
    const monthName = MONTH_NAME_SOURCE;
    const weekdayName = 'Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Thrisday|Thr|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?';
    let next = text;

    next = next.replace(
      new RegExp(`\\b(Before|After|Until|Since|From|To|On|Date|Effective|Expires?)\\s+(${digit}{1,2})([-/.])(${digit}{1,2})\\3(${year})${noDigitAfter}`, 'gi'),
      (match, prefix, first, separator, second, gregorianYear) => {
        return `${prefix} ${convertNumericDate(`${first}${separator}${second}${separator}${gregorianYear}`, first, separator, second, gregorianYear)}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}(${monthName})\\s+(${year})${noDigitAfter}`, 'gi'),
      (match, month, gregorianYear) => {
        return formatPersianMonthYear(toInt(gregorianYear), getGregorianMonth(month)) || match;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}(${year})[-\\s/](${monthName})[-\\s/](${digit}{1,2})(?:\\s+(${digit}{1,2}:${digit}{2}(?::${digit}{2})?))?${noDigitAfter}`, 'gi'),
      (match, gregorianYear, month, day, timeText = '') => {
        const source = parseDateWithOptionalTime(toInt(gregorianYear), getGregorianMonth(month), toInt(day), timeText);
        const parts = getCalendarParts(source.gy, source.gm, source.gd);

        if (!parts) {
          return match;
        }

        const timeSuffix = timeText ? ` ${source.time}` : '';
        return `${formatPersianTextDate(parts)}${timeSuffix}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}(${year})[-\\s/](${digit}{1,2})[-\\s/](${monthName})(?:\\s+(${digit}{1,2}:${digit}{2}(?::${digit}{2})?))?${noDigitAfter}`, 'gi'),
      (match, gregorianYear, day, month, timeText = '') => {
        const source = parseDateWithOptionalTime(toInt(gregorianYear), getGregorianMonth(month), toInt(day), timeText);
        const parts = getCalendarParts(source.gy, source.gm, source.gd);

        if (!parts) {
          return match;
        }

        const timeSuffix = timeText ? ` ${source.time}` : '';
        return `${formatPersianTextDate(parts)}${timeSuffix}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}((?:${weekdayName}),?\\s+)?(${digit}{1,2})[-\\s](${monthName})[-\\s](${shortYear})(?:\\s+(${digit}{1,2}:${digit}{2}(?::${digit}{2})?)\\s*((?:GMT|UTC)?[+-]${digit}{4}|GMT|UTC|Z|[A-Z]{2,5})?)?${noDigitAfter}`, 'gi'),
      (match, weekday = '', day, month, shortGregorianYear, timeText = '', zoneText = '') => {
        const fullYear = 2000 + toInt(shortGregorianYear);
        const source = parseDateWithOptionalTime(fullYear, getGregorianMonth(month), toInt(day), timeText, zoneText);
        const parts = getCalendarParts(source.gy, source.gm, source.gd);

        if (!parts) {
          return match;
        }

        const weekdayText = weekday ? `${getWeekdayFa(source.gy, source.gm, source.gd)}، ` : '';
        const timeSuffix = timeText ? ` ${source.time}${source.zone ? ` ${source.zone}` : ''}` : '';
        return `${weekdayText}${formatPersianTextDate(parts)}${timeSuffix}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}((?:${weekdayName})\\s+)(${monthName})\\s+(${digit}{1,2})\\s+(${digit}{1,2}:${digit}{2}(?::${digit}{2})?)\\s+(${year})(?:\\s*((?:GMT|UTC)?[+-]${digit}{4}|GMT|UTC|Z|[A-Z]{2,5}))?${noDigitAfter}`, 'gi'),
      (match, weekday, month, day, timeText, gregorianYear, zoneText = '') => {
        const source = parseDateWithOptionalTime(toInt(gregorianYear), getGregorianMonth(month), toInt(day), timeText, zoneText);
        const parts = getCalendarParts(source.gy, source.gm, source.gd);

        if (!parts) {
          return match;
        }

        return `${getWeekdayFa(source.gy, source.gm, source.gd)} ${formatPersianTextDate(parts)} ${source.time}${source.zone ? ` ${source.zone}` : ''}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}((?:${weekdayName}),?\\s+)?(${monthName})\\s+(${digit}{1,2}),?\\s+(${year})(?:\\s+(${digit}{1,2}:${digit}{2}(?::${digit}{2})?))?${noDigitAfter}`, 'gi'),
      (match, weekday = '', month, day, gregorianYear, timeText = '') => {
        const source = parseDateWithOptionalTime(toInt(gregorianYear), getGregorianMonth(month), toInt(day), timeText);
        const parts = getCalendarParts(source.gy, source.gm, source.gd);

        if (!parts) {
          return match;
        }

        const weekdayText = weekday ? `${getWeekdayFa(source.gy, source.gm, source.gd)}، ` : '';
        const timeSuffix = timeText ? ` ${source.time}` : '';
        return `${weekdayText}${formatPersianTextDate(parts, 'month-day-year')}${timeSuffix}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}(${monthName})(?:[-/]|\\s+)(${digit}{1,2})(?!,?\\s+${year})(?:,)?(?:\\s+(${digit}{1,2}:${digit}{2}(?::${digit}{2})?)\\s*([A-Z]{2,5})?)?${noDigitAfter}`, 'gi'),
      (match, month, day, timeText = '', zoneText = '') => {
        const sourceYear = new Date().getFullYear();
        const source = parseDateWithOptionalTime(sourceYear, getGregorianMonth(month), toInt(day), timeText, zoneText);
        const parts = getCalendarParts(source.gy, source.gm, source.gd);

        if (!parts) {
          return match;
        }

        const timeSuffix = timeText ? ` ${source.time}${source.zone ? ` ${source.zone}` : ''}` : '';
        const dateText = getCustomDate(parts) || `${getMonthName(parts.jm)} ${parts.jd}`;
        return `${dateText}${timeSuffix}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}((?:${weekdayName}),?\\s+)?(${digit}{1,2})\\s+(${monthName})\\s+(${year})(?:\\s+(${digit}{1,2}:${digit}{2}(?::${digit}{2})?)(?:\\s*((?:GMT|UTC)?[+-]${digit}{4}|GMT|UTC|Z))?)?${noDigitAfter}`, 'gi'),
      (match, weekday = '', day, month, gregorianYear, timeText = '', zoneText = '') => {
        const source = parseDateWithOptionalTime(toInt(gregorianYear), getGregorianMonth(month), toInt(day), timeText, zoneText);
        const parts = getCalendarParts(source.gy, source.gm, source.gd);

        if (!parts) {
          return match;
        }

        const weekdayText = weekday ? `${getWeekdayFa(source.gy, source.gm, source.gd)}، ` : '';
        const timeSuffix = timeText ? ` ${source.time}${source.zone ? ` ${source.zone}` : ''}` : '';
        return `${weekdayText}${formatPersianTextDate(parts)}${timeSuffix}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}((?:${weekdayName})\\s+)(${monthName})\\s+(${digit}{1,2})\\s+(${year})\\s+(${digit}{1,2}:${digit}{2}(?::${digit}{2})?)\\s+((?:GMT|UTC)?[+-]${digit}{4}|GMT|UTC|Z)([^\\n\\r]*)?${noDigitAfter}`, 'gi'),
      (match, weekday, month, day, gregorianYear, timeText, zoneText, tail = '') => {
        const source = parseDateWithOptionalTime(toInt(gregorianYear), getGregorianMonth(month), toInt(day), timeText, zoneText);
        const parts = getCalendarParts(source.gy, source.gm, source.gd);

        if (!parts) {
          return match;
        }

        const weekdayText = `${getWeekdayFa(source.gy, source.gm, source.gd)} `;
        return `${weekdayText}${getMonthName(parts.jm)} ${parts.jd} ${parts.jy} ${source.time}${source.zone ? ` ${source.zone}` : ''}${settings.convertTimes ? '' : tail}`;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}((?:${weekdayName})\\s+)(${monthName})\\s+(${digit}{1,2})\\s+(${year})${noDigitAfter}`, 'gi'),
      (match, weekday, month, day, gregorianYear) => {
        const gregorianMonth = getGregorianMonth(month);
        const parts = getCalendarParts(toInt(gregorianYear), gregorianMonth, toInt(day));
        return parts ? `${getWeekdayFa(toInt(gregorianYear), gregorianMonth, toInt(day))} ${getMonthName(parts.jm)} ${parts.jd} ${parts.jy}` : match;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}(${monthName})\\s+(${digit}{1,2}),?\\s+(${year})${noDigitAfter}`, 'gi'),
      (match, month, day, gregorianYear) => {
        const parts = getCalendarParts(toInt(gregorianYear), getGregorianMonth(month), toInt(day));
        return parts ? formatPersianTextDate(parts, 'month-day-year') : match;
      }
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}(${year})([-/.])(${digit}{1,2})\\2(${digit}{1,2})((?:T|\\s)(${digit}{1,2}:${digit}{2}(?::${digit}{2})?(?:\\.\\d+)?)(Z|[+-]${digit}{2}:?${digit}{2})?)?${noDigitAfter}`, 'g'),
      (match, gregorianYear, separator, second, third, suffix, timeText, zoneText) => convertNumericDate(match, gregorianYear, separator, second, third, suffix?.[0] || '', timeText, zoneText)
    );

    next = next.replace(
      new RegExp(`${noDigitBefore}(${digit}{1,2})([-/.])(${digit}{1,2})\\2(${year})${noDigitAfter}`, 'g'),
      (match, first, separator, second, gregorianYear) => convertNumericDate(match, first, separator, second, gregorianYear)
    );

    return next;
  }

  function convertNumbers(text) {
    const english = '0123456789';
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    const arabic = '٠١٢٣٤٥٦٧٨٩';

    if (settings.numberMode === 'enToFa') {
      return text.replace(/[0-9]/g, digit => persian[english.indexOf(digit)]);
    }

    if (settings.numberMode === 'faToEn') {
      return text.replace(/[۰-۹]/g, digit => String(persian.indexOf(digit)));
    }

    if (settings.numberMode === 'enToAr') {
      return text.replace(/[0-9]/g, digit => arabic[english.indexOf(digit)]);
    }

    if (settings.numberMode === 'faToAr') {
      return text.replace(/[۰-۹]/g, digit => arabic[persian.indexOf(digit)]);
    }

    if (settings.numberMode === 'arToFa') {
      return text.replace(/[٠-٩]/g, digit => persian[arabic.indexOf(digit)]);
    }

    if (settings.numberMode === 'arToEn') {
      return text.replace(/[٠-٩]/g, digit => String(arabic.indexOf(digit)));
    }

    return text;
  }

  function shouldSkipNode(node) {
    const parent = node.parentElement;

    if (!parent) {
      return node.getRootNode?.() === document;
    }

    return SKIP_TAGS.has(parent.tagName)
      || parent.isContentEditable
      || Boolean(parent.closest(DATEPICKER_SELECTOR));
  }

  function markTextElement(node) {
    const parent = node.parentElement;

    if (!parent || !node.nodeValue.trim() || parent.closest(ICON_SELECTOR)) {
      return;
    }

    parent.dataset.jdcText = '1';
    delete parent.dataset.jdcDir;
    delete parent.dataset.jdcAlign;

    const computed = window.getComputedStyle(parent);
    const currentDirection = computed.direction || 'ltr';
    const normalizeAlign = value => {
      if (value === 'start') {
        return currentDirection === 'rtl' ? 'right' : 'left';
      }

      if (value === 'end') {
        return currentDirection === 'rtl' ? 'left' : 'right';
      }

      return value;
    };
    const currentAlign = normalizeAlign(computed.textAlign);

    if (settings.directionMode !== 'inherit' && settings.directionMode !== currentDirection) {
      parent.dataset.jdcDir = settings.directionMode;
    }

    if (settings.textAlignMode !== 'inherit' && settings.textAlignMode !== currentAlign) {
      parent.dataset.jdcAlign = settings.textAlignMode;
    }
  }

  function mayContainConvertibleText(text) {
    if (!text || !text.trim()) {
      return false;
    }

    if (settings.numberMode !== 'none' && /[0-9۰-۹٠-٩]/.test(text)) {
      return true;
    }

    if (/\b(a\.?m\.?|p\.?m\.?)\b/i.test(text)) {
      return true;
    }

    if (settings.convertRelativeTimes && containsRelativeTime(text)) {
      return true;
    }

    if (/\b(Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Thrisday|Thr|Fri(?:day)?|Sat(?:urday)?|Jan(?:uary)?\.?|Feb(?:ruary)?\.?|Mar(?:ch)?\.?|Apr(?:il)?\.?|May\.?|Jun(?:e)?\.?|Jul(?:y)?\.?|Aug(?:ust)?\.?|Sep(?:t\.?|tember)?\.?|Oct(?:ober)?\.?|Nov(?:ember)?\.?|Dec(?:ember)?\.?)\b/i.test(text)) {
      return true;
    }

    return settings.convertDates && /[0-9۰-۹٠-٩]{1,4}[-/.][0-9۰-۹٠-٩]{1,2}|[0-9۰-۹٠-٩]{1,2}[-/.][0-9۰-۹٠-٩]{1,4}/.test(text);
  }

  function transform(text, allowStandaloneYear = false, allowStandaloneMonth = false) {
    let next = text;

    if (settings.convertDates) {
      if (allowStandaloneMonth) {
        next = localizeStandaloneMonthName(next);
      }

      next = convertDates(next);
      next = convertStandaloneYears(next, allowStandaloneYear);
    }

    next = localizeWeekdayNames(next);
    next = convertRelativeTimeText(next);
    next = convertStandaloneTimes(next);

    return convertNumbers(next);
  }

  function applyLayout() {
    let style = document.getElementById('jdc-layout-style');

    if (settings.directionMode === 'inherit' && settings.textAlignMode === 'inherit') {
      style?.remove();
      return;
    }

    if (!style) {
      style = document.createElement('style');
      style.id = 'jdc-layout-style';
      (document.head || document.documentElement).append(style);
    }

    style.textContent = `
      [data-jdc-dir="rtl"]:not(${ICON_SELECTOR}) {
        direction: rtl !important;
        unicode-bidi: isolate !important;
      }
      [data-jdc-dir="ltr"]:not(${ICON_SELECTOR}) {
        direction: ltr !important;
        unicode-bidi: isolate !important;
      }
      [data-jdc-align="right"]:not(${ICON_SELECTOR}) {
        text-align: right !important;
      }
      [data-jdc-align="left"]:not(${ICON_SELECTOR}) {
        text-align: left !important;
      }
      [data-jdc-align="center"]:not(${ICON_SELECTOR}) {
        text-align: center !important;
      }
    `;
  }

  function rememberOriginal(node) {
    if (!originalText.has(node) || renderedText.get(node) !== node.nodeValue) {
      originalText.set(node, node.nodeValue);
    }
  }

  function rememberOriginalAttribute(element, attr, value) {
    const rendered = renderedAttributes.get(element);

    if (!originalAttributes.has(element) || rendered?.[attr] !== value) {
      originalAttributes.set(element, {
        ...(originalAttributes.get(element) || {}),
        [attr]: value
      });
    }
  }

  function isRelativeMetadataElement(element) {
    return Boolean(element?.matches?.(RELATIVE_METADATA_SELECTOR) || element?.closest?.(RELATIVE_METADATA_SELECTOR));
  }

  function getPreviousInlineText(node) {
    let currentNode = node;
    let text = '';

    while (currentNode?.parentNode && currentNode.parentNode.nodeType === Node.ELEMENT_NODE) {
      let current = currentNode.previousSibling;

      while (current) {
        text = `${current.textContent || ''}${text}`;
        current = current.previousSibling;
      }

      if (/[0-9۰-۹٠-٩]\s*$/.test(text.replace(/\s+/g, ' ').trim())) {
        break;
      }

      if (isRelativeMetadataElement(currentNode.parentElement)) {
        currentNode = currentNode.parentNode;
        continue;
      }

      break;
    }

    return text.replace(/\s+/g, ' ').trim();
  }

  function getSplitRelativeTail(node) {
    const host = node.parentElement?.closest?.(RELATIVE_METADATA_SELECTOR) || node.parentElement;

    if (!settings.convertRelativeTimes || !isRelativeMetadataElement(host)) {
      return null;
    }

    const previousText = getPreviousInlineText(node);

    if (!/[0-9۰-۹٠-٩]\s*$/.test(previousText)) {
      return null;
    }

    const text = String(node.nodeValue || '');
    const relativeMatch = text.match(new RegExp(`^\\s*(${RELATIVE_TIME_UNIT_PATTERN})\\s+ago\\b`, 'i'));

    if (relativeMatch) {
      return formatRelativeTail(relativeMatch[1]);
    }

    const durationMatch = text.match(new RegExp(`^\\s*(${RELATIVE_TIME_UNIT_PATTERN})\\s*$`, 'i'));
    return durationMatch ? formatDurationTail(durationMatch[1]) : null;
  }

  function setRenderedTextNode(node, value) {
    if (!node || node.nodeType !== Node.TEXT_NODE || node.nodeValue === value) {
      return false;
    }

    rememberOriginal(node);
    node.nodeValue = value;
    renderedText.set(node, value);
    return true;
  }

  function getSingleTextNode(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE || element.childNodes.length !== 1) {
      return null;
    }

    return element.firstChild?.nodeType === Node.TEXT_NODE ? element.firstChild : null;
  }

  function setRelativeTailNode(node, unitText) {
    const next = formatRelativeTail(unitText);

    if (node.nodeType === Node.TEXT_NODE) {
      return setRenderedTextNode(node, next);
    }

    const textNode = getSingleTextNode(node);
    return textNode ? setRenderedTextNode(textNode, next) : false;
  }

  function setDurationTailNode(node, unitText) {
    const next = formatDurationTail(unitText);

    if (node.nodeType === Node.TEXT_NODE) {
      return setRenderedTextNode(node, next);
    }

    const textNode = getSingleTextNode(node);
    return textNode ? setRenderedTextNode(textNode, next) : false;
  }

  function getImmediateText(node) {
    return (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE)
      ? String(node.textContent || '').replace(/\s+/g, ' ').trim()
      : '';
  }

  function applySplitRelativeChildren(root) {
    if (!settings.convertRelativeTimes || !root || root.nodeType === Node.TEXT_NODE) {
      return;
    }

    const elements = [
      ...(root.nodeType === Node.ELEMENT_NODE ? [root] : []),
      ...(root.querySelectorAll?.(RELATIVE_METADATA_SELECTOR) || [])
    ];
    const digitOnly = /^[0-9۰-۹٠-٩]+$/;
    const relativeTailPattern = new RegExp(`^(${RELATIVE_TIME_UNIT_PATTERN})\\s+ago\\b`, 'i');
    const durationTailPattern = new RegExp(`^(${RELATIVE_TIME_UNIT_PATTERN})$`, 'i');

    for (const element of elements) {
      if (!isRelativeMetadataElement(element) || element.closest(`input, textarea, select, option, [contenteditable="true"], ${DATEPICKER_SELECTOR}`)) {
        continue;
      }

      const childNodes = [...element.childNodes];

      for (let index = 0; index < childNodes.length - 1; index += 1) {
        const numberText = getImmediateText(childNodes[index]);

        if (!digitOnly.test(numberText)) {
          continue;
        }

        const tailText = getImmediateText(childNodes[index + 1]);
        const relativeMatch = tailText.match(relativeTailPattern);

        if (relativeMatch) {
          setRelativeTailNode(childNodes[index + 1], relativeMatch[1]);
          continue;
        }

        const durationMatch = tailText.match(durationTailPattern);

        if (durationMatch) {
          setDurationTailNode(childNodes[index + 1], durationMatch[1]);
        }
      }
    }
  }

  function applyTextNode(node) {
    if (shouldSkipNode(node)) {
      return;
    }

    markTextElement(node);
    const allowStandaloneYear = isInsidePickedSelector(node);
    const allowStandaloneMonth = isMonthLabelNode(node);
    const splitRelativeTail = getSplitRelativeTail(node);

    if (!splitRelativeTail && !allowStandaloneYear && !mayContainConvertibleText(node.nodeValue)) {
      return;
    }

    rememberOriginal(node);
    const next = splitRelativeTail || transform(originalText.get(node), allowStandaloneYear, allowStandaloneMonth);

    if (node.nodeValue !== next) {
      node.nodeValue = next;
      renderedText.set(node, next);
    }
  }

  function applyElementAttributes(root) {
    if ((!settings.convertDates && !settings.convertRelativeTimes) || !root || root.nodeType === Node.TEXT_NODE) {
      return;
    }

    const elements = [
      ...(root.nodeType === Node.ELEMENT_NODE ? [root] : []),
      ...(root.querySelectorAll?.(TRANSFORMABLE_ATTRIBUTES.map(attr => `[${attr}]`).join(',')) || [])
    ];

    for (const element of elements) {
      if (element.closest(`input, textarea, select, option, [contenteditable="true"], ${DATEPICKER_SELECTOR}`)) {
        continue;
      }

      for (const attr of TRANSFORMABLE_ATTRIBUTES) {
        const value = element.getAttribute(attr);

        if (!value) {
          continue;
        }

        const shouldConvertRelative = settings.convertRelativeTimes && containsRelativeTime(value);
        const shouldConvertDate = settings.convertDates && mayContainConvertibleText(value);

        if (!shouldConvertRelative && !shouldConvertDate) {
          continue;
        }

        rememberOriginalAttribute(element, attr, value);
        const original = originalAttributes.get(element)?.[attr] || value;
        const next = transform(original);

        if (next !== value) {
          element.setAttribute(attr, next);
          renderedAttributes.set(element, {
            ...(renderedAttributes.get(element) || {}),
            [attr]: next
          });
        }
      }
    }
  }

  function isMonthLabelNode(node) {
    const parent = node.parentElement;

    if (!parent) {
      return false;
    }

    if (!new RegExp(`^\\s*(?:${MONTH_NAME_SOURCE})\\s*$`, 'i').test(node.nodeValue || '')) {
      return false;
    }

    const context = [
      parent.className,
      parent.getAttribute('aria-label'),
      parent.getAttribute('data-testid'),
      parent.getAttribute('role'),
      parent.closest('[class*="calendar" i], [class*="date" i], [class*="month" i], [class*="contribution" i]')?.className
    ].filter(Boolean).join(' ');

    return parent.matches('.sr-only, [aria-hidden="true"], [class*="month" i], [class*="calendar" i], [class*="date" i], [class*="contribution" i]')
      || /\b(month|calendar|date|contribution|timeline|history)\b/i.test(context);
  }

  function applyFragmentDates(root) {
    if (!settings.convertDates || !root || root.nodeType === Node.TEXT_NODE) {
      return;
    }

    const scanRoot = root;
    const elements = [
      ...(scanRoot.matches?.('*') ? [scanRoot] : []),
      ...(scanRoot.querySelectorAll?.('span, td, th, div, p, a, time, relative-time, local-time') || [])
    ];

    for (const element of elements) {
      if (element.closest(`input, textarea, select, option, [contenteditable="true"], ${DATEPICKER_SELECTOR}`)) {
        continue;
      }

      if (!element.children.length || element.children.length > 4 || element.textContent.length > 40) {
        continue;
      }

      const text = element.textContent.replace(/\s+/g, ' ').trim();
      const match = text.match(new RegExp(`^(${MONTH_NAME_SOURCE})\\s+((?:19|20|21)\\d{2}|(?:۱۹|۲۰|۲۱)[۰-۹]{2}|(?:١٩|٢٠|٢١)[٠-٩]{2})$`, 'i'));

      if (!match) {
        continue;
      }

      const next = formatPersianMonthYear(toInt(match[2]), getGregorianMonth(match[1]));

      if (!next || next === text) {
        continue;
      }

      element.dataset.jdcOriginalText ||= element.textContent;
      element.textContent = convertNumbers(next);
    }
  }

  function applyFragmentRelativeTimes(root) {
    if (!settings.convertRelativeTimes || !root || root.nodeType === Node.TEXT_NODE) {
      return;
    }

    const elements = [
      ...(root.nodeType === Node.ELEMENT_NODE ? [root] : []),
      ...(root.querySelectorAll?.('span, div, p, a, time, yt-formatted-string') || [])
    ];

    for (const element of elements) {
      if (element.closest(`input, textarea, select, option, [contenteditable="true"], ${DATEPICKER_SELECTOR}`)) {
        continue;
      }

      const isMetadata = isRelativeMetadataElement(element);
      const textLimit = isMetadata ? 140 : 40;

      if (!isMetadata || element.textContent.length > textLimit) {
        continue;
      }

      const text = element.textContent.replace(/\s+/g, ' ').trim();
      const hasAgo = /\sago\b/i.test(text);
      const durationMatch = getDurationTimeMatch(text);

      if (element.children.length) {
        continue;
      }

      if ((!hasAgo || !containsRelativeTime(text)) && !durationMatch) {
        continue;
      }

      const original = element.dataset.jdcOriginalText || text;
      const next = durationMatch
        ? convertNumbers(formatDurationTime(durationMatch[1], durationMatch[2]))
        : transform(original);

      if (next && next !== text) {
        element.dataset.jdcOriginalText ||= text;
        element.textContent = next;
      }
    }
  }

  function hasConvertibleRelativeText(text) {
    return containsRelativeTime(String(text || '').replace(/\s+/g, ' ').trim());
  }

  function healRelativeTimes(root = document) {
    if (!settings.convertRelativeTimes || !root || !isEnabledForThisDomain()) {
      return;
    }

    const scanRoot = root.nodeType === Node.TEXT_NODE ? root.parentElement : root;

    if (!scanRoot) {
      return;
    }

    const candidates = [
      ...(scanRoot.matches?.(RELATIVE_METADATA_SELECTOR) ? [scanRoot] : []),
      ...(scanRoot.querySelectorAll?.(RELATIVE_METADATA_SELECTOR) || [])
    ];

    for (const element of candidates.slice(0, 800)) {
      if (element.closest(`input, textarea, select, option, [contenteditable="true"], ${DATEPICKER_SELECTOR}`)) {
        continue;
      }

      if (!hasConvertibleRelativeText(element.textContent)) {
        continue;
      }

      processRoot(element);
    }
  }

  function isAggressiveRelativeDomain() {
    return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(getDomain());
  }

  function getRoots() {
    const selectors = [
      settings.manualSelector.trim(),
      ...(settings.domainSelectors?.[getDomain()] || [])
    ].filter(Boolean);

    const roots = [document.body || document.documentElement];

    for (const selector of selectors) {
      try {
        roots.push(...document.querySelectorAll(selector));
      } catch (error) {
        continue;
      }
    }

    return [...new Set(roots.filter(Boolean))];
  }

  function isInsidePickedSelector(node) {
    const parent = node.parentElement;
    const selectors = settings.domainSelectors?.[getDomain()] || [];

    if (!parent || !selectors.length) {
      return false;
    }

    return selectors.some(selector => {
      try {
        return Boolean(parent.closest(selector));
      } catch (error) {
        return false;
      }
    });
  }

  function getSelectorForElement(element) {
    if (!element || element === document.documentElement) {
      return 'html';
    }

    const stableId = element.id && !/\s/.test(element.id) && !/\d{3,}/.test(element.id)
      ? `#${CSS.escape(element.id)}`
      : '';

    if (stableId) {
      return stableId;
    }

    const candidates = [];
    const stableClasses = [...element.classList]
      .filter(className => !/^(active|selected|hover|focus|open|show|visible|current|disabled)$/i.test(className))
      .filter(className => !/\d{3,}/.test(className))
      .slice(0, 3);

    for (const attr of ['data-testid', 'data-role', 'itemprop', 'data-ng-bind-html', 'ng-bind-html', 'data-ng-bind', 'ng-bind']) {
      const value = element.getAttribute?.(attr);

      if (value && value.length <= 140 && !/\d{3,}/.test(value)) {
        candidates.push(`${element.localName}[${attr}="${CSS.escape(value)}"]`);
      }
    }

    if (stableClasses.length) {
      candidates.push(`${element.localName}.${stableClasses.map(className => CSS.escape(className)).join('.')}`);
      candidates.push(`.${stableClasses.map(className => CSS.escape(className)).join('.')}`);
    }

    const parent = element.parentElement;
    const parentClasses = parent
      ? [...parent.classList]
        .filter(className => !/^(active|selected|hover|focus|open|show|visible|current|disabled)$/i.test(className))
        .filter(className => !/\d{3,}/.test(className))
        .slice(0, 2)
      : [];

    if (parent && parentClasses.length) {
      const parentSelector = `${parent.localName}.${parentClasses.map(className => CSS.escape(className)).join('.')}`;
      candidates.push(`${parentSelector} > ${element.localName}`);
      candidates.push(`${parentSelector} ${element.localName}`);
    }

    candidates.push(element.localName);

    for (const selector of candidates) {
      try {
        const matches = [...document.querySelectorAll(selector)];

        if (matches.length > 1 && matches.length <= 300 && matches.includes(element)) {
          return selector;
        }

        if (matches.length === 1 && matches[0] === element) {
          return selector;
        }
      } catch (error) {
        continue;
      }
    }

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let part = current.localName;
      const classNames = [...current.classList]
        .filter(className => !/^(active|selected|hover|focus|open|show|visible)$/i.test(className))
        .filter(className => !/\d{3,}/.test(className))
        .slice(0, 2);

      if (classNames.length) {
        part += classNames.map(className => `.${CSS.escape(className)}`).join('');
      }

      const parent = current.parentElement;

      if (parent) {
        const siblings = [...parent.children].filter(child => child.localName === current.localName);

        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }

      parts.unshift(part);
      current = parent;

      const selector = parts.join(' > ');

      try {
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      } catch (error) {
        continue;
      }
    }

    return parts.join(' > ');
  }

  function stopPicker() {
    if (!picker) {
      return;
    }

    picker.target?.style.removeProperty('outline');
    picker.target?.style.removeProperty('outline-offset');
    document.removeEventListener('mouseover', picker.onMouseOver, true);
    document.removeEventListener('click', picker.onClick, true);
    document.removeEventListener('keydown', picker.onKeyDown, true);
    picker = null;
  }

  async function savePickedSelector(selector) {
    const stored = await migrateRelativeDefault(await getStorage(DEFAULT_SETTINGS));
    const domain = getDomain();
    const domainSelectors = stored.domainSelectors || {};
    const selectors = new Set(domainSelectors[domain] || []);
    selectors.add(selector);
    domainSelectors[domain] = [...selectors];
    chrome.storage.local.set({ domainSelectors }, refresh);
  }

  function startPicker() {
    stopPicker();

    picker = {
      target: null,
      onMouseOver(event) {
        if (picker.target) {
          picker.target.style.removeProperty('outline');
          picker.target.style.removeProperty('outline-offset');
        }

        picker.target = event.target;
        picker.target.style.setProperty('outline', '2px solid #116466', 'important');
        picker.target.style.setProperty('outline-offset', '2px', 'important');
      },
      onClick(event) {
        event.preventDefault();
        event.stopPropagation();

        const selector = getSelectorForElement(event.target);
        stopPicker();
        savePickedSelector(selector);
      },
      onKeyDown(event) {
        if (event.key === 'Escape') {
          stopPicker();
        }
      }
    };

    document.addEventListener('mouseover', picker.onMouseOver, true);
    document.addEventListener('click', picker.onClick, true);
    document.addEventListener('keydown', picker.onKeyDown, true);
  }

  function walk(root, callback) {
    if (!root) {
      return;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      callback(root);
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      callback(node);
      node = walker.nextNode();
    }
  }

  function observeShadowRoot(shadowRoot) {
    if (!observer || !shadowRoot || observedShadowRoots.has(shadowRoot)) {
      return;
    }

    observedShadowRoots.add(shadowRoot);
    observer.observe(shadowRoot, MUTATION_OBSERVER_OPTIONS);
  }

  function processRoot(root) {
    if (!root) {
      return;
    }

    applySplitRelativeChildren(root);
    applyFragmentRelativeTimes(root);
    walk(root, applyTextNode);
    applyDateAttributes(root);
    applyFragmentDates(root);
    applyElementAttributes(root);

    if (root.nodeType === Node.ELEMENT_NODE && root.shadowRoot) {
      observeShadowRoot(root.shadowRoot);
      processRoot(root.shadowRoot);
    }

    const elements = root.querySelectorAll?.('*') || [];

    for (const element of elements) {
      if (element.shadowRoot) {
        observeShadowRoot(element.shadowRoot);
        processRoot(element.shadowRoot);
      }
    }
  }

  function normalizeProcessRoot(root) {
    if (!root) {
      return null;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      return root.parentElement || root;
    }

    if (root.nodeType === Node.DOCUMENT_NODE) {
      return root.body || root.documentElement;
    }

    return root;
  }

  function getCompactRoots(roots) {
    const normalized = [...new Set(roots.map(normalizeProcessRoot).filter(Boolean))];

    return normalized.filter(root => {
      if (!root.contains) {
        return true;
      }

      return !normalized.some(other => other !== root && other.contains?.(root));
    });
  }

  function scheduleRoot(root) {
    const normalizedRoot = normalizeProcessRoot(root);

    if (!normalizedRoot) {
      return;
    }

    pendingRoots.add(normalizedRoot);

    if (processScheduled) {
      return;
    }

    processScheduled = true;
    const runner = () => {
      processScheduled = false;
      const roots = [...pendingRoots];
      pendingRoots.clear();

      for (const root of getCompactRoots(roots)) {
        processRoot(root);
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runner, { timeout: 350 });
      return;
    }

    window.requestAnimationFrame(runner);
  }

  function scanBodyIfActive() {
    if (document.body && isEnabledForThisDomain()) {
      scheduleRoot(document.body);
    }
  }

  function scheduleFullRescan(delay = 700) {
    window.clearTimeout(fullRescanTimer);
    fullRescanTimer = window.setTimeout(scanBodyIfActive, delay);
  }

  function scheduleMutationSettlingScans() {
    for (const timer of mutationScanTimers) {
      window.clearTimeout(timer);
    }

    mutationScanTimers.length = 0;

    for (const delay of [80, 350, 1200, 2600]) {
      mutationScanTimers.push(window.setTimeout(scanBodyIfActive, delay));
    }
  }

  function scheduleRelativeHealing(root = document.body) {
    for (const timer of relativeHealTimers) {
      window.clearTimeout(timer);
    }

    relativeHealTimers.length = 0;

    if (!settings.convertRelativeTimes) {
      return;
    }

    const delays = isAggressiveRelativeDomain()
      ? [0, 16, 50, 120, 250, 500, 900, 1400, 2200, 3600, 5200, 8000]
      : [30, 120, 450, 1000, 2200, 4200];

    for (const delay of delays) {
      relativeHealTimers.push(window.setTimeout(() => healRelativeTimes(root), delay));
    }
  }

  function scheduleStartupScans() {
    for (const timer of startupScanTimers) {
      window.clearTimeout(timer);
    }

    startupScanTimers.length = 0;

    for (const delay of [250, 1000, 2500, 5000]) {
      startupScanTimers.push(window.setTimeout(() => {
        scanBodyIfActive();
      }, delay));
    }
  }

  function applyFont() {
    let style = document.getElementById('jdc-font-style');

    if (!settings.fontFamily && !settings.fontSize) {
      style?.remove();
      return;
    }

    if (!style) {
      style = document.createElement('style');
      style.id = 'jdc-font-style';
      (document.head || document.documentElement).append(style);
    }

    const fontFamily = sanitizeFontFamily(settings.fontFamily);
    const fontSize = sanitizeFontSize(settings.fontSize);

    style.textContent = `
      :where(body, body *):not(svg):not(svg *):not(img):not(canvas):not([class*="icon" i]):not([class*="material" i]):not([class^="fa-"]):not([class*=" fa-"]):not([class*="dashicons" i]):not([class*="glyphicon" i]):not([class*="symbol" i]) {
        ${fontFamily ? `font-family: ${fontFamily} !important;` : ''}
        ${fontSize ? `font-size: ${fontSize} !important;` : ''}
      }
    `;
  }

  function applyDateAttributes(root) {
    if (!settings.convertDates || !root) {
      return;
    }

    const scanRoot = root.nodeType === Node.TEXT_NODE ? root.parentElement : root;

    if (!scanRoot) {
      return;
    }

    const elements = scanRoot.matches?.('time[datetime], relative-time[datetime], local-time[datetime]')
      ? [scanRoot]
      : [...scanRoot.querySelectorAll?.('time[datetime], relative-time[datetime], local-time[datetime]') || []];

    for (const element of elements) {
      if (element.closest(`input, textarea, select, option, [contenteditable="true"], ${DATEPICKER_SELECTOR}`)) {
        continue;
      }

      if (shouldPreserveTimeElement(element)) {
        continue;
      }

      const datetime = element.getAttribute('datetime');
      const next = formatDateTimeElement(new Date(datetime));

      if (!next || element.textContent === next) {
        continue;
      }

      element.dataset.jdcOriginalText ||= element.textContent;
      element.textContent = next;
    }
  }

  function shouldPreserveTimeElement(element) {
    const text = String(element.textContent || '').trim();
    const label = String(element.getAttribute('aria-label') || element.getAttribute('title') || '').trim();
    const nonGregorianText = /[آ-یء-ي]/.test(label) && !/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b/i.test(label);
    const relativeText = /(?:پیش|قبل|ago|minute|minutes|hour|hours|day|days|week|weeks|لحظه|دقیقه|ساعت|روز|هفته|قبل|منذ|دقيقة|ساعة|يوم|أسبوع)/i.test(text);

    return nonGregorianText || relativeText;
  }

  function sanitizeFontSize(value) {
    const normalized = String(value || '').trim();
    return /^(?:1[0-9]|2[0-8])px$/.test(normalized) ? normalized : '';
  }

  function sanitizeFontFamily(value) {
    const genericFamilies = new Set([
      'serif',
      'sans-serif',
      'monospace',
      'cursive',
      'fantasy',
      'system-ui',
      'ui-serif',
      'ui-sans-serif',
      'ui-monospace',
      'emoji',
      'math',
      'fangsong'
    ]);
    const families = String(value || '')
      .split(',')
      .map(family => family.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
      .filter(family => family.length <= 120 && !/[;{}]/.test(family))
      .slice(0, 6);

    if (!families.length) {
      return '';
    }

    return families.map(family => {
      const normalized = family.toLowerCase();
      return genericFamilies.has(normalized)
        ? normalized
        : `"${family.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }).join(', ');
  }

  function restoreText(restoreAll = false) {
    const roots = restoreAll ? [document.body || document.documentElement] : getRoots();

    for (const root of roots) {
      walk(root, node => {
        if (originalText.has(node) && renderedText.get(node) === node.nodeValue) {
          node.nodeValue = originalText.get(node);
          renderedText.delete(node);
        }
      });

      if (root.nodeType !== Node.TEXT_NODE) {
        const elements = [
          ...(root.matches?.('[data-jdc-original-text]') ? [root] : []),
          ...(root.querySelectorAll?.('[data-jdc-original-text]') || [])
        ];

        for (const element of elements) {
          element.textContent = element.dataset.jdcOriginalText;
          delete element.dataset.jdcOriginalText;
        }

        const attributeElements = [
          ...(root.nodeType === Node.ELEMENT_NODE ? [root] : []),
          ...(root.querySelectorAll?.(TRANSFORMABLE_ATTRIBUTES.map(attr => `[${attr}]`).join(',')) || [])
        ];

        for (const element of attributeElements) {
          const originals = originalAttributes.get(element);
          const rendered = renderedAttributes.get(element);

          if (!originals || !rendered) {
            continue;
          }

          for (const [attr, value] of Object.entries(originals)) {
            if (element.getAttribute(attr) === rendered[attr]) {
              element.setAttribute(attr, value);
            }
          }

          renderedAttributes.delete(element);
        }
      }
    }

    for (const timer of relativeHealTimers) {
      window.clearTimeout(timer);
    }

    relativeHealTimers.length = 0;
    document.getElementById('jdc-font-style')?.remove();
    document.getElementById('jdc-layout-style')?.remove();
  }

  function applyPage() {
    if (!document.body) {
      return;
    }

    if (!isEnabledForThisDomain()) {
      restoreText();
      return;
    }

    applyFont();
    applyLayout();

    for (const root of getRoots()) {
      processRoot(root);
    }

    scheduleRelativeHealing(document.body);
  }

  function observe() {
    if (observer) {
      observer.disconnect();
    }

    observedShadowRoots = new WeakSet();
    observer = new MutationObserver(mutations => {
      if (!isEnabledForThisDomain()) {
        return;
      }

      for (const mutation of mutations) {
        scheduleRoot(mutation.target);

        for (const node of mutation.addedNodes) {
          scheduleRoot(node);
        }

        for (const node of mutation.removedNodes) {
          scheduleRoot(node.parentElement || mutation.target);
        }

        if (mutation.type === 'characterData') {
          scheduleRoot(mutation.target.parentElement || mutation.target);
        }

        if (mutation.type === 'attributes') {
          scheduleRoot(mutation.target);
        }

        if (settings.convertRelativeTimes) {
          const target = normalizeProcessRoot(mutation.target);
          const relativeRoot = target?.closest?.(RELATIVE_METADATA_SELECTOR) || target;
          window.requestAnimationFrame(() => healRelativeTimes(relativeRoot));
          window.setTimeout(() => healRelativeTimes(relativeRoot), 0);
        }
      }

      scheduleMutationSettlingScans();
      scheduleRelativeHealing(document.body);
      scheduleFullRescan();
    });

    observer.observe(document.documentElement, MUTATION_OBSERVER_OPTIONS);

    if (document.body) {
      processRoot(document.body);
    }
  }

  async function refresh() {
    if (observer) {
      observer.disconnect();
    }

    restoreText(true);
    const stored = await migrateRelativeDefault(await getStorage(DEFAULT_SETTINGS));
    await loadLanguageData(stored.uiLanguage);
    settings = getEffectiveSettings(stored);
    applyPage();
    observe();
    scheduleStartupScans();
  }

  function preview(nextSettings) {
    if (observer) {
      observer.disconnect();
    }

    restoreText(true);
    settings = {
      ...settings,
      ...(nextSettings || {}),
      siteSettings: settings.siteSettings || {},
      domainSelectors: settings.domainSelectors || {},
      domainOverrides: settings.domainOverrides || {}
    };
    applyPage();
    observe();
    scheduleStartupScans();
  }

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type === 'JDC_SETTINGS_CHANGED') {
      refresh();
    }

    if (message?.type === 'JDC_PREVIEW_SETTINGS') {
      preview(message.settings || {});
    }

    if (message?.type === 'JDC_START_PICKER') {
      startPicker();
    }
  });

  document.documentElement.dataset.jdcExtension = 'installed';
  window.__jalaliDateConverterPro = { refresh, preview, startPicker };
  refresh();
})();
