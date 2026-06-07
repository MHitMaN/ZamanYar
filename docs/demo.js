const localeLabels = {
  'fa-IR': { weekday: 'یکشنبه', month: 'خرداد', shortWeekday: 'پنجشنبه', span: 'اردیبهشت/خرداد ۱۴۰۵' },
  'fa-AF': { weekday: 'یکشنبه', month: 'جوزا', shortWeekday: 'پنجشنبه', span: 'ثور/جوزا ۱۴۰۵' },
  'ps-AF': { weekday: 'یکشنبه', month: 'غبرګولی', shortWeekday: 'پنجشنبه', span: 'غویی/غبرګولی ۱۴۰۵' },
  'ar-SA': { weekday: 'الأحد', month: 'ذو الحجة', shortWeekday: 'الخميس', span: 'ذو القعدة/ذو الحجة ۱۴۴۷' }
};

const demoCopy = {
  fa: {
    'hero.title': 'تبدیل هوشمند تاریخ برای مرورگرهای مدرن',
    'hero.text': 'تاریخ‌های میلادی را در صفحات وب به جلالی یا هجری قمری تبدیل کن، با تنظیمات جدا برای هر سایت، فونت، اعداد، زبان و جهت متن.',
    'demo.language': 'زبان دمو',
    'intro.languages.title': 'برای کاربران فارسی، اردو و عربی',
    'intro.languages.text': 'افزونه خروجی جلالی/شمسی، دری، پشتو و هجری قمری را پشتیبانی می‌کند و UI خود افزونه هم در فارسی، اردو، عربی و انگلیسی قابل تغییر است.',
    'intro.safe.title': 'بدون خراب‌کردن سایت‌ها',
    'intro.safe.text': 'Datepickerها، آیکن‌فونت‌ها، inputها و کدها از تبدیل کنار گذاشته می‌شوند.',
    'intro.domain.title': 'تنظیمات جدا برای هر دامنه',
    'intro.domain.text': 'هر سایت می‌تواند تقویم، زبان خروجی، فونت، سایز، ضخامت، جهت متن، چینش و selectorهای مخصوص خودش را داشته باشد.',
    'samples.title': 'نمونه‌ها',
    'samples.github': 'تبدیل تاریخ‌های GitHub و relative-time',
    'samples.hijri': 'خروجی هجری قمری برای کاربران عرب‌زبان',
    'samples.settings': 'تنظیمات سریع و تنظیمات پیشرفته',
    'downloads.title': 'دانلود و نصب',
    'downloads.text': 'پس از انتشار رسمی، لینک‌های فروشگاه‌ها اینجا قرار می‌گیرند. خروجی‌های zip هم از GitHub Releases قابل دریافت هستند.',
    'downloads.safari': 'Safari نیازمند بسته‌بندی و انتشار به عنوان Safari Web Extension از طریق Xcode/App Store است.',
    'live.title': 'دموی زنده',
    'install.title': 'افزونه در این صفحه فعال نیست.',
    'install.text': 'برای مشاهده تبدیل واقعی تاریخ‌ها در مرورگر، افزونه را نصب یا برای این صفحه فعال کنید. پیش‌نمایش زیر همچنان به‌صورت شبیه‌سازی‌شده در دسترس است.',
    'control.font': 'فونت',
    'control.fontHelp': 'فونت را روی سیستم‌عامل نصب کنید؛ افزونه همان فونت نصب‌شده را برای انتخاب نشان می‌دهد.',
    'control.loadFonts': 'بارگذاری فونت‌های سیستم',
    'control.direction': 'جهت',
    'control.align': 'چینش',
    'control.locale': 'زبان خروجی',
    'about.title': 'درباره سازنده',
    'author.role': 'توسعه‌دهنده فول‌استک',
    'quote': '«تقویم‌ها متفاوت‌اند؛ زمان باید برای همه خوانا بماند.»',
    'copyright.note': 'با ذکر منبع آزادانه استفاده کنید.',
    'donate.title': 'حمایت مالی',
    'donate.text': 'اگر این افزونه به کارت آمد، با TRX یا BTC از توسعه نسخه‌های بهتر حمایت کن.',
    'donate.trx': 'کیف پول TRX',
    'donate.btc': 'کیف پول BTC'
  },
  ur: {
    'hero.title': 'Modern browsers کے لیے smart date conversion',
    'hero.text': 'Web pages میں Gregorian dates کو Jalali یا Lunar Hijri میں convert کریں، ہر site کے لیے الگ settings کے ساتھ۔',
    'demo.language': 'Demo language',
    'intro.languages.title': 'Persian، Urdu اور Arabic users کے لیے',
    'intro.languages.text': 'Extension Jalali/Shamsi، Dari، Pashto اور Lunar Hijri output support کرتی ہے، اور UI چار languages میں بدلتا ہے۔',
    'intro.safe.title': 'Sites کو خراب کیے بغیر',
    'intro.safe.text': 'Datepickers، icon fonts، inputs اور code blocks conversion سے محفوظ رہتے ہیں۔',
    'intro.domain.title': 'ہر domain کے لیے الگ settings',
    'intro.domain.text': 'ہر site اپنا calendar، output language، font، size، weight، direction، alignment اور selectors رکھ سکتی ہے۔',
    'samples.title': 'Samples',
    'samples.github': 'GitHub اور relative-time dates conversion',
    'samples.hijri': 'Arabic users کے لیے Lunar Hijri output',
    'samples.settings': 'Quick اور advanced settings',
    'downloads.title': 'Download and install',
    'downloads.text': 'Official publish کے بعد store links یہاں آئیں گے۔ ZIP builds GitHub Releases سے ملیں گے۔',
    'downloads.safari': 'Safari کو Xcode/App Store کے ذریعے Safari Web Extension package کی ضرورت ہے۔',
    'live.title': 'Live demo',
    'install.title': 'ایکسٹینشن اس صفحے پر فعال نہیں ہے۔',
    'install.text': 'Browser میں حقیقی date conversion دیکھنے کے لیے extension install کریں یا اس page کے لیے enable کریں۔ نیچے simulated preview پھر بھی دستیاب رہے گا۔',
    'control.font': 'Font',
    'control.fontHelp': 'Font install کریں؛ extension اسے system fonts سے دکھائے گی۔',
    'control.loadFonts': 'System fonts load کریں',
    'control.direction': 'Direction',
    'control.align': 'Alignment',
    'control.locale': 'Output language',
    'about.title': 'تخلیق کار کے بارے میں',
    'author.role': 'فُل اسٹیک ڈویلپر',
    'quote': '«تقویمیں مختلف ہیں؛ وقت سب کے لیے پڑھنے کے قابل رہنا چاہیے۔»',
    'copyright.note': 'ماخذ کے ذکر کے ساتھ آزادانہ استعمال کریں۔',
    'donate.title': 'حمایت مالی',
    'donate.text': 'اگر یہ ایکسٹینشن آپ کے کام آئے تو TRX یا BTC سے آئندہ نسخوں کی حمایت کریں۔',
    'donate.trx': 'TRX والیٹ',
    'donate.btc': 'BTC والیٹ'
  },
  ar: {
    'hero.title': 'تحويل ذكي للتاريخ في المتصفحات الحديثة',
    'hero.text': 'حوّل التواريخ الميلادية في صفحات الويب إلى جلالي أو هجري قمري مع إعدادات مستقلة لكل موقع.',
    'demo.language': 'لغة العرض',
    'intro.languages.title': 'للمستخدمين بالفارسية والأردية والعربية',
    'intro.languages.text': 'تدعم الإضافة الجلالي والشمسي والدري والبشتو والهجري القمري، كما أن واجهتها متاحة بأربع لغات.',
    'intro.safe.title': 'من دون تعطيل المواقع',
    'intro.safe.text': 'يتم استثناء Datepicker وخطوط الأيقونات وحقول الإدخال وكتل الكود من التحويل.',
    'intro.domain.title': 'إعدادات مستقلة لكل نطاق',
    'intro.domain.text': 'يمكن لكل موقع امتلاك التقويم واللغة والخط والحجم والوزن والاتجاه والمحاذاة والselectors الخاصة به.',
    'samples.title': 'نماذج',
    'samples.github': 'تحويل تواريخ GitHub و relative-time',
    'samples.hijri': 'إخراج هجري قمري للمستخدمين العرب',
    'samples.settings': 'إعدادات سريعة ومتقدمة',
    'downloads.title': 'التحميل والتثبيت',
    'downloads.text': 'بعد النشر الرسمي ستظهر روابط المتاجر هنا، كما تتوفر حزم ZIP من GitHub Releases.',
    'downloads.safari': 'Safari يحتاج إلى تغليف ونشر كـ Safari Web Extension عبر Xcode/App Store.',
    'live.title': 'عرض مباشر',
    'install.title': 'الإضافة غير مفعّلة على هذه الصفحة.',
    'install.text': 'لمشاهدة تحويل التواريخ فعليا داخل المتصفح، ثبّت الإضافة أو فعّلها لهذه الصفحة. ستبقى المعاينة المحاكية أدناه متاحة.',
    'control.font': 'الخط',
    'control.fontHelp': 'ثبّت الخط على نظام التشغيل؛ ستعرضه الإضافة ضمن خطوط النظام.',
    'control.loadFonts': 'تحميل خطوط النظام',
    'control.direction': 'الاتجاه',
    'control.align': 'المحاذاة',
    'control.locale': 'لغة الإخراج',
    'about.title': 'عن المطور',
    'author.role': 'مطور متكامل',
    'quote': '«التقاويم مختلفة؛ يجب أن يبقى الوقت مقروءًا للجميع.»',
    'copyright.note': 'يمكنك الاستخدام بحرية مع ذكر المصدر.',
    'donate.title': 'تبرع',
    'donate.text': 'إذا أفادتك هذه الإضافة، ادعم الإصدارات القادمة عبر TRX أو BTC.',
    'donate.trx': 'محفظة TRX',
    'donate.btc': 'محفظة BTC'
  },
  en: {
    'hero.title': 'Smart Date Conversion for Modern Browsers',
    'hero.text': 'Convert Gregorian dates on web pages to Jalali or Lunar Hijri, with per-site controls for fonts, numbers, language, and layout.',
    'demo.language': 'Demo language',
    'intro.languages.title': 'For Persian, Urdu, and Arabic Users',
    'intro.languages.text': 'The extension supports Jalali/Shamsi, Dari, Pashto, and Lunar Hijri output, and the extension UI is available in four languages.',
    'intro.safe.title': 'Safe for Real Websites',
    'intro.safe.text': 'Datepickers, icon fonts, inputs, and code blocks are excluded from conversion.',
    'intro.domain.title': 'Per-Domain Settings',
    'intro.domain.text': 'Each site can have its own calendar, output language, font, size, weight, direction, alignment, and selectors.',
    'samples.title': 'Samples',
    'samples.github': 'GitHub and relative-time conversion',
    'samples.hijri': 'Lunar Hijri output for Arabic users',
    'samples.settings': 'Quick and advanced settings',
    'downloads.title': 'Download and Install',
    'downloads.text': 'Official store links will be added after publication. ZIP builds are available from GitHub Releases.',
    'downloads.safari': 'Safari requires packaging and publishing as a Safari Web Extension through Xcode/App Store.',
    'live.title': 'Live Demo',
    'install.title': 'The extension is not active on this page.',
    'install.text': 'Install the extension or enable it for this page to see real date conversion in the browser. The simulated preview below remains available.',
    'control.font': 'Font',
    'control.fontHelp': 'Install the font on your operating system; the extension exposes it from system fonts.',
    'control.loadFonts': 'Load system fonts',
    'control.direction': 'Direction',
    'control.align': 'Alignment',
    'control.locale': 'Output language',
    'about.title': 'About the Creator',
    'author.role': 'Full-stack developer',
    'quote': '“Calendars differ; time should remain readable for everyone.”',
    'copyright.note': 'Use freely with source attribution.',
    'donate.title': 'Donate',
    'donate.text': 'If this extension helps you, support future releases with TRX or BTC.',
    'donate.trx': 'TRX wallet',
    'donate.btc': 'BTC wallet'
  }
};

const sectionText = {
  fa: active => `${active.weekday}، ۳ ${active.month} ۱۴۰۵ ۲۰:۱۵:۰۹ - May 10 -> ۲۰ اردیبهشت - Thr/thrisday -> ${active.shortWeekday} - May 2026 -> ${active.span}`,
  ur: active => `${active.weekday}، ۳ ${active.month} ۱۴۰۵ ۲۰:۱۵:۰۹ - May 10 -> ۲۰ اردیبهشت - Thr/thrisday -> ${active.shortWeekday} - May 2026 -> ${active.span}`,
  ar: active => `${active.weekday}، ۱۸ ${active.month} ۱۴۴۷ ۲۰:۱۵:۰۹ - May 10 -> ۲۳ ذو القعدة - Thr/thrisday -> ${active.shortWeekday} - May 2026 -> ${active.span}`,
  en: active => `${active.weekday}, 3 ${active.month} 1405 20:15:09 - May 10 -> 20 Ordibehesht - Thr/thrisday -> ${active.shortWeekday} - May 2026 -> ${active.span}`
};

const controls = document.getElementById('controls');
const preview = document.getElementById('preview');
const demoLanguage = document.getElementById('demoLanguage');
const directionControl = document.getElementById('direction');
const alignControl = document.getElementById('align');
const fontControl = document.getElementById('fontFamily');
const loadDemoSystemFonts = document.getElementById('loadDemoSystemFonts');
const installNotice = document.getElementById('installNotice');
const copyrightYear = document.getElementById('copyrightYear');
const cards = [...document.querySelectorAll('[data-demo-card]')];
const results = [...document.querySelectorAll('[data-demo-result]')];
let userChangedLayout = false;

function quoteFontFamily(name) {
  return `"${String(name).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}", sans-serif`;
}

async function populateFonts(includeInstalled = false) {
  const fallbackFonts = [
    { label: 'System UI', value: 'system-ui, sans-serif' },
    { label: 'Tahoma', value: '"Tahoma", sans-serif' },
    { label: 'Serif', value: 'serif' },
    { label: 'Sans Serif', value: 'sans-serif' },
    { label: 'Monospace', value: 'monospace' }
  ];
  const seen = new Set(['']);

  fontControl.textContent = '';
  const siteFont = document.createElement('option');
  siteFont.value = '';
  siteFont.textContent = 'Site font';
  fontControl.append(siteFont);

  try {
    if (includeInstalled && window.queryLocalFonts) {
      const fonts = await window.queryLocalFonts();
      const systemGroup = document.createElement('optgroup');
      systemGroup.label = 'Installed system fonts';
      fontControl.append(systemGroup);

      for (const family of [...new Set(fonts.map(font => font.family).filter(Boolean))].sort((a, b) => a.localeCompare(b))) {
        const value = quoteFontFamily(family);

        if (seen.has(value)) {
          continue;
        }

        const option = document.createElement('option');
        option.value = value;
        option.textContent = family;
        systemGroup.append(option);
        seen.add(value);
      }
    }
  } catch (error) {
    // The public demo may be viewed without local-font permission.
  }

  const fallbackGroup = document.createElement('optgroup');
  fallbackGroup.label = 'System fallback fonts';
  fontControl.append(fallbackGroup);

  for (const font of fallbackFonts) {
    if (seen.has(font.value)) {
      continue;
    }

    const option = document.createElement('option');
    option.value = font.value;
    option.textContent = font.label;
    fallbackGroup.append(option);
    seen.add(font.value);
  }
}

function render() {
  const fontFamily = fontControl.value;
  const direction = directionControl.value;
  const align = alignControl.value;
  const locale = document.getElementById('locale').value;
  const active = localeLabels[locale];

  preview.style.fontFamily = fontFamily || '';
  preview.dir = direction;

  for (const card of cards) {
    card.dir = direction;
    card.style.direction = direction;
    card.style.textAlign = align;
  }

  for (const result of results) {
    const key = result.dataset.demoResult;
    result.textContent = sectionText[key](active);
  }
}

function renderDemoLanguage() {
  const language = demoLanguage.value;
  const copy = demoCopy[language] || demoCopy.fa;
  const isRtl = ['fa', 'ur', 'ar'].includes(language);
  document.documentElement.lang = language;
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

  if (!userChangedLayout) {
    directionControl.value = isRtl ? 'rtl' : 'ltr';
    alignControl.value = isRtl ? 'right' : 'left';
  }

  for (const element of document.querySelectorAll('[data-demo-i18n]')) {
    element.textContent = copy[element.dataset.demoI18n] || element.textContent;
  }

  updateCopyrightYear(language);
  render();
}

function updateCopyrightYear(language) {
  if (!copyrightYear) {
    return;
  }

  if (language === 'en') {
    copyrightYear.textContent = new Date().getFullYear();
    return;
  }

  try {
    copyrightYear.textContent = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric'
    }).format(new Date()).replace(/\D/g, '');
  } catch (error) {
    copyrightYear.textContent = '1405';
  }
}

function checkExtensionPresence() {
  const installed = document.documentElement.dataset.jdcExtension === 'installed';
  installNotice.hidden = installed;
}

controls.addEventListener('change', event => {
  if (event.target === directionControl || event.target === alignControl) {
    userChangedLayout = true;
  }

  render();
});
demoLanguage.addEventListener('change', renderDemoLanguage);
renderDemoLanguage();
checkExtensionPresence();
populateFonts().then(render);
loadDemoSystemFonts.addEventListener('click', () => {
  populateFonts(true).then(render);
});
setTimeout(checkExtensionPresence, 600);
