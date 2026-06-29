const SOAPService = (function () {
  function generate(payload) {
    const contextTitle = payload.contextTitle || '選択項目';
    const checkedItems = payload.checkedItems || [];
    const background = payload.background || {};

    const itemTexts = checkedItems.map(function (item) {
      return item.text || item;
    }).filter(Boolean);

    const backgroundText = buildBackgroundText(background);
    const assessmentText = itemTexts.length ? itemTexts.join('、') : '現時点で追加確認事項なし';

    return {
      soap: [
        'S: ' + (backgroundText ? '患者背景: ' + backgroundText : '患者背景に関する追加情報なし。'),
        'O: 対象: ' + contextTitle + '。確認事項: ' + assessmentText + '。',
        'A: 患者背景と生活機能への影響を踏まえ、服薬支援上の継続確認が必要。',
        'P: 確認事項に沿って説明・支援を行い、必要時は処方医等へ情報共有する。',
      ].join('\n'),
      medicationHistory: buildMedicationHistory(contextTitle, itemTexts, backgroundText),
      handoff: buildHandoff(contextTitle, itemTexts),
    };
  }

  function buildBackgroundText(background) {
    const risks = (background.risks || []).filter(Boolean);
    const concern = String(background.concern || '').trim();
    const parts = [];

    if (risks.length) {
      parts.push(risks.join('、'));
    }
    if (concern) {
      parts.push('相談内容: ' + concern);
    }

    return parts.join(' / ');
  }

  function buildMedicationHistory(contextTitle, itemTexts, backgroundText) {
    const checked = itemTexts.length ? itemTexts.join('、') : '現時点で追加確認事項なし';
    const backgroundClause = backgroundText ? '患者背景（' + backgroundText + '）を踏まえ、' : '';
    return contextTitle + 'について、' +
      backgroundClause +
      '確認事項は「' + checked + '」。説明・支援内容を継続確認する。';
  }

  function buildHandoff(contextTitle, itemTexts) {
    if (!itemTexts.length) {
      return contextTitle + 'について、次回も患者背景・生活機能の変化を確認する。';
    }
    return contextTitle + 'について、次回確認したい点は「' + itemTexts.join('、') + '」。必要時に追加聴取する。';
  }

  return {
    generate: generate,
  };
})();
