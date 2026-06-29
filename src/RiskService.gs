const RiskService = (function () {
  function getRedFlags(rows, context) {
    rows = rows || [];
    const matched = rows.filter(function (row) {
      const targets = [context.title, context.id].concat(context.relatedIds || []).filter(Boolean);
      return Object.keys(row).some(function (key) {
        if (key.charAt(0) === '_') return false;
        const cell = String(row[key] || '').toLowerCase();
        return targets.some(function (target) {
          const value = String(target || '').toLowerCase();
          return value && cell.indexOf(value) !== -1;
        });
      });
    });

    return (matched.length ? matched : []).map(function (row, index) {
      const text = CfnService.firstValue(row, ['Red Flag', 'レッドフラッグ', '危険サイン', '注意', '内容']) || summarize(row);
      return {
        id: 'risk-' + index,
        text: text,
        urgency: CfnService.firstValue(row, ['緊急度', 'Urgency', '重要度', 'Severity_1to5']) || '',
      };
    }).filter(function (item) {
      return item.text;
    });
  }

  function summarize(row) {
    return Object.keys(row).filter(function (key) {
      return key.charAt(0) !== '_' && String(row[key] || '').trim();
    }).slice(0, 3).map(function (key) {
      return row[key];
    }).join(' / ');
  }

  return {
    getRedFlags: getRedFlags,
  };
})();
