# ZamanYar

الإصدار: `1.0.0`

اللغات:

- [فارسی](README.md)
- [اردو](README.ur.md)
- [English](README.en.md)

## نظرة عامة
ZamanYar إضافة للمتصفحات Chrome وEdge وFirefox وBrave وSafari. تحول تواريخ الصفحات من الميلادي إلى الجلالي/الهجري الشمسي أو الهجري القمري، مع إعدادات مستقلة لكل موقع للأرقام والخطوط واتجاه النص ومحاذاته وصيغة التاريخ والوقت.

> "تختلف التقاويم؛ لكن الزمن يجب أن يبقى مقروءا للجميع."
>
> MHitMaN

## التقويم الهجري القمري
<p align="center">
  <img src="assets/images/islamic-calendar-symbol.png" alt="Islamic calendar symbol" height="220">
</p>

التقويم الهجري القمري تقويم إسلامي يعتمد على دورة القمر، وتتكون السنة فيه من 12 شهرا قمريا. في هذه الإضافة يتم توليد التاريخ الهجري القمري عبر تقويم `islamic-umalqura` المتاح في `Intl.DateTimeFormat`.

Source: https://en.wikipedia.org/wiki/Islamic_calendar

## الميزات
- تحويل التاريخ الميلادي إلى الجلالي أو الهجري القمري في صيغ Date وISO وRFC والصيغ الرقمية والنصية.
- تحويل الوقت النسبي والنصوص داخل Shadow DOM.
- تحويل الأرقام بين الفارسية والعربية والإنجليزية.
- تعريب AM/PM وتحويل الوقت اختياريا حسب المنطقة الزمنية.
- إعدادات مستقلة لكل موقع للخط، حجم الخط، الاتجاه، المحاذاة، لغة الإخراج، صيغة التاريخ وصيغة الوقت.
- حماية Datepicker وحقول الإدخال وكتل الكود وخطوط الأيقونات.

## Demo
صفحة العرض موجودة في `docs/`. يمكن نشرها عبر GitHub Pages من مجلد `docs`.

## الخطوط
لاستخدام خط مخصص، ثبّت الخط على نظام التشغيل لديك. بعد التثبيت، افتح إعداد الخط في الإضافة واختر "تحميل خطوط النظام" حتى تظهر الخطوط المثبتة في قائمة اختيار الخط.

إذا لم يوفر المتصفح API لقراءة قائمة خطوط النظام، ستظهر فقط خيارات عامة مثل `System UI` و`serif` و`sans-serif` و`monospace`.

## Build
```bash
npm install
npm run build
```

## Safari
تحتاج Safari Web Extension إلى التحويل إلى تطبيق Safari/Xcode ثم التوقيع والنشر عبر App Store.

## Contact
- GitHub: https://github.com/MHitMaN
- LinkedIn: https://www.linkedin.com/in/mgh71/
- Email: ghasemi71ir@gmail.com

## Donate
إذا وفر لك المشروع وقتا، يمكنك دعم الإصدارات القادمة عبر TRX أو BTC.

```text
TRX wallet: TXXW1bMV2pSeiq72hvcokCATdHjJPpAKWC
BTC wallet: bc1q6vv6f9euvv8jfw3ftv88jrp7rrflejc98uacer
```

## License
MIT License مع وجوب الحفاظ على حقوق النشر ونسبة المصدر وروابط الكاتب في النسخ المشتقة أو المنسوخة.
