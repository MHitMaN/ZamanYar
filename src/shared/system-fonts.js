(() => {
  const GENERIC_FONTS = [
    { label: 'System UI', value: 'system-ui, sans-serif' },
    { label: 'Serif', value: 'serif' },
    { label: 'Sans Serif', value: 'sans-serif' },
    { label: 'Monospace', value: 'monospace' }
  ];

  function quoteFontFamily(name) {
    return `"${String(name).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}", sans-serif`;
  }

  function getFontLabel(value) {
    return String(value || '').split(',')[0].replace(/^["']|["']$/g, '').trim() || value;
  }

  function appendOption(select, label, value, seen) {
    if (seen.has(value)) {
      return;
    }

    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.append(option);
    seen.add(value);
  }

  async function getInstalledFonts() {
    if (window.queryLocalFonts) {
      const fonts = await window.queryLocalFonts();
      return [...new Set(fonts.map(font => font.family).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));
    }

    return [];
  }

  async function populateFontSelect(select, options = {}) {
    if (!select) {
      return [];
    }

    const {
      defaultLabel = 'Site font',
      installedLabel = 'Installed system fonts',
      fallbackLabel = 'System fallback fonts',
      selectedValues = []
    } = options;
    const selected = select.value;
    const valuesToKeep = [selected, ...selectedValues].filter(Boolean);
    const seen = new Set();

    select.textContent = '';
    appendOption(select, defaultLabel, '', seen);

    let installedFonts = [];
    try {
      installedFonts = await getInstalledFonts();
    } catch (error) {
      installedFonts = [];
    }

    if (installedFonts.length) {
      const group = document.createElement('optgroup');
      group.label = installedLabel;
      select.append(group);

      for (const font of installedFonts) {
        const value = quoteFontFamily(font);

        if (seen.has(value)) {
          continue;
        }

        const option = document.createElement('option');
        option.value = value;
        option.textContent = font;
        group.append(option);
        seen.add(value);
      }
    }

    const fallbackGroup = document.createElement('optgroup');
    fallbackGroup.label = fallbackLabel;
    select.append(fallbackGroup);

    for (const font of GENERIC_FONTS) {
      if (seen.has(font.value)) {
        continue;
      }

      const option = document.createElement('option');
      option.value = font.value;
      option.textContent = font.label;
      fallbackGroup.append(option);
      seen.add(font.value);
    }

    for (const value of valuesToKeep) {
      appendOption(select, getFontLabel(value), value, seen);
    }

    select.value = valuesToKeep.find(value => seen.has(value)) || '';
    return installedFonts;
  }

  window.JDC_SYSTEM_FONTS = {
    populateFontSelect
  };
})();
