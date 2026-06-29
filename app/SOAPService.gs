const SOAPService = (function () {
  function generate(payload) {
    const contextTitle = payload.contextTitle || '選択項目';
    const checkedItems = payload.checkedItems || [];
    const background = payload.background || {};

    const itemTexts = checkedItems.map(function (item) {
      return item.text || item;
    }).filter(Boolean);

    const backgroundText = buildBackgroundText(background);
    const assessmentText = itemTexts.length ? itemTexts.join('、') : '確認項目の選択なし';

    return {
      soap: [
        'S: ' + (backgroundText || '患者背景は一時入力なし'),
        'O: CFNで「' + contextTitle + '」を確認。確認項目: ' + assessmentText,
        'A: 患者背景と生活機能への影響を踏まえ、服薬支援上の確認が必要。',
        'P: 選択した確認項目をもとに説明・支援内容を整理し、必要時は処方医等へ情報共有する。',
      ].join('\n'),
      medicationHistory: buildMedicationHistory(contextTitle, itemTexts, backgroundText),
      handoff: buildHandoff(contextTitle, itemTexts),
    };
  }

  function buildBackgroundText(background) {
    const labels = {
      age: '年齢',
      living: '生活状況',
      adl: 'ADL',
      concern: '本人・家族の困りごと',
    };

    return Object.keys(labels).map(function (key) {
      const value = String(background[key] || '').trim();
      return value ? labels[key] + ': ' + value : '';
    }).filter(Boolean).join(' / ');
  }

  function buildMedicationHistory(contextTitle, itemTexts, backgroundText) {
    const checked = itemTexts.length ? itemTexts.join('、') : '特記事項なし';
    return '【薬歴】' + contextTitle + 'について確認。' +
      (backgroundText ? '患者背景（' + backgroundText + '）を踏まえ、' : '') +
      '確認事項: ' + checked + '。説明・支援内容を継続確認。';
  }

  function buildHandoff(contextTitle, itemTexts) {
    if (!itemTexts.length) {
      return '【申し送り】' + contextTitle + 'について、次回も患者背景・生活機能の変化を確認。';
    }
    return '【申し送り】' + contextTitle + 'で確認したい点: ' + itemTexts.join('、') + '。必要時に追加聴取。';
  }

  return {
    generate: generate,
  };
})();
