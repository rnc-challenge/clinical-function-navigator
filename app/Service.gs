const CfnService = (function () {
  const ENTRY_TYPES = [
    { id: 'drugGroup', label: '薬効群', icon: '💊', sheet: 'Drug_Master' },
    { id: 'disease', label: '疾患', icon: '🩺', sheet: 'Clinical_Management' },
    { id: 'function', label: '生活機能', icon: '🚶', sheet: 'Functional_Impact' },
    { id: 'background', label: '患者背景', icon: '👤', sheet: 'Assessment_Item' },
  ];

  function getHomeData() {
    const workbook = CfnRepository.getWorkbookData();
    return {
      tagline: '患者支援に必要な視点を、一つに。必要な情報を、必要な人へ、必要なタイミングで。',
      entries: ENTRY_TYPES.map(function (entry) {
        return Object.assign({}, entry, {
          items: buildEntryItems(entry.id, workbook),
        });
      }),
    };
  }

  function getClinicalView(entryType, entryId) {
    const workbook = CfnRepository.getWorkbookData();
    const selected = findEntryItem(entryType, entryId, workbook);
    const context = Object.assign({
      id: entryId,
      title: entryId || '未選択',
      type: entryType,
      sourceType: entryType,
    }, selected || {}, {
      type: entryType,
      sourceType: entryType,
    });

    return {
      context: context,
      basicInfo: buildBasicInfo(context, workbook),
      assessmentItems: buildSection(workbook.Assessment_Item, context, ['確認項目', '確認すること', 'Assessment', 'Item', '質問', '内容']),
      explanations: buildSection(workbook.Clinical_Management, context, ['説明項目', '説明すること', 'Explanation', '患者説明', '内容']),
      supports: buildSection(workbook.Clinical_Action, context, ['支援項目', '支援すること', 'Action', '介入', '内容']),
      redFlags: RiskService.getRedFlags(workbook.Red_Flag, context),
      functionalImpacts: buildSection(workbook.Functional_Impact, context, ['生活機能への影響', 'Functional Impact', '影響', '内容']),
      evidence: buildDrugEvidence(workbook.Drug_Evidence, workbook.Evidence, context),
      guidelines: buildReferences(workbook.Guideline_Reference, context),
      templates: workbook.SOAP_Template,
    };
  }

  function buildEntryItems(entryType, workbook) {
    if (entryType === 'drugGroup') {
      return uniqueItems(workbook.Drug_Master, ['薬効群', '薬効分類', '薬効', 'Drug Class', 'Drug_Class', 'class', 'category']);
    }
    if (entryType === 'disease') {
      // TODO(v0.2): Disease_Masterへ移行し、疾患入口は疾患マスターから表示する。
      return uniqueItems(workbook.Clinical_Management, ['疾患', 'Disease', '適応疾患', '病名']);
    }
    if (entryType === 'function') {
      return uniqueItems(workbook.Functional_Impact, ['生活機能', 'Function', 'ADL', '機能']);
    }
    if (entryType === 'background') {
      // TODO(v0.2): Patient_Background_Masterへ移行し、患者背景入口は背景マスターから表示する。
      return uniqueItems(workbook.Assessment_Item, ['患者背景', 'Background', '対象', '属性']);
    }
    return [];
  }

  function findEntryItem(entryType, entryId, workbook) {
    const items = buildEntryItems(entryType, workbook);
    return items.filter(function (item) {
      return item.id === entryId || item.title === entryId;
    })[0] || null;
  }

  function uniqueItems(rows, keyCandidates) {
    const byTitle = {};
    (rows || []).forEach(function (row) {
      const title = firstValue(row, keyCandidates);
      if (!title) return;
      if (!byTitle[title]) {
        byTitle[title] = {
          id: slug(title),
          title: title,
          description: firstValue(row, ['説明', 'Description', '概要', 'メモ', '確認の焦点', '主な作用']) || '',
          relatedIds: [],
        };
      }

      ['DrugID', 'FunctionID', 'DiseaseID', 'ID'].forEach(function (idKey) {
        const value = firstValue(row, [idKey]);
        if (value && byTitle[title].relatedIds.indexOf(value) === -1) {
          byTitle[title].relatedIds.push(value);
        }
      });
    });

    return Object.keys(byTitle).map(function (title) {
      return byTitle[title];
    }).sort(function (a, b) {
      return a.title.localeCompare(b.title, 'ja');
    });
  }

  function buildBasicInfo(context, workbook) {
    const rows = relatedRows(workbook.Drug_Master, context);
    const medicines = rows.map(function (row) {
      return firstValue(row, ['薬剤名', '一般名', '商品名', 'Drug Name', 'Generic', 'Name']);
    }).filter(Boolean);

    return {
      title: context.title,
      description: context.description || firstValue(rows[0], ['確認の焦点', '説明', 'Description', '概要', '主な作用']) || '',
      medicines: uniqueStrings(medicines).slice(0, 12),
    };
  }

  function buildSection(rows, context, textCandidates) {
    return relatedRows(rows, context).map(function (row, index) {
      const text = firstValue(row, textCandidates.concat(['Question_or_Item', 'OutputLabel', '確認コメント', '主な理由'])) || rowToSummary(row);
      return {
        id: slug(context.id + '-' + index + '-' + text),
        text: text,
        category: firstValue(row, ['分類', 'Category', '種別']) || '',
        note: firstValue(row, ['補足', 'Note', '注意', '理由']) || '',
      };
    }).filter(function (item) {
      return item.text;
    });
  }

  function buildReferences(rows, context) {
    return relatedRows(rows, context).map(function (row) {
      return {
        title: firstValue(row, ['タイトル', 'Title', '文献名', 'ガイドライン名', '名称', 'Recommendation', 'KeyMessage', 'ClinicalPearl', 'Memo']) || rowToSummary(row),
        url: firstValue(row, ['URL', 'Link', 'リンク']),
        note: firstValue(row, ['要約', 'Summary', 'Note', 'メモ']) || '',
      };
    }).filter(function (item) {
      return item.title;
    });
  }

  function buildDrugEvidence(drugEvidenceRows, evidenceRows, context) {
    const evidenceById = {};
    (evidenceRows || []).forEach(function (row) {
      const evidenceId = firstValue(row, ['EvidenceID', 'Evidence_ID', '文献ID']);
      if (evidenceId) evidenceById[evidenceId] = row;
    });

    return relatedRows(drugEvidenceRows, context).map(function (linkRow) {
      const evidenceId = firstValue(linkRow, ['EvidenceID', 'Evidence_ID', '文献ID']);
      const evidenceRow = evidenceById[evidenceId] || {};
      const merged = Object.assign({}, evidenceRow, linkRow);

      return {
        id: evidenceId || slug(rowToSummary(linkRow)),
        title: firstValue(merged, ['タイトル', 'Title', '文献名', 'Recommendation', 'KeyMessage', 'ClinicalPearl', 'Memo']) || rowToSummary(merged),
        url: firstValue(merged, ['URL', 'Link', 'リンク']),
        note: firstValue(merged, ['Recommendation', 'KeyMessage', 'ClinicalPearl', 'EvidenceLevel', 'Memo', '要約', 'Summary', 'Note', 'メモ']) || '',
        evidenceId: evidenceId,
      };
    }).filter(function (item) {
      return item.title;
    });
  }

  function relatedRows(rows, context) {
    rows = rows || [];
    if (!context || !context.title) return rows;

    // TODO(v0.2): 全セル部分一致ではなく、DrugID / DiseaseID / FunctionID / BackgroundID による関連付けへ移行する。
    const exact = rows.filter(function (row) {
      return rowMatchesContext(row, context);
    });

    return exact;
  }

  function rowMatchesContext(row, context) {
    const values = [context.title, context.id].concat(context.relatedIds || []);
    return values.some(function (value) {
      return rowMatches(row, value);
    });
  }

  function rowMatches(row, value) {
    const needle = normalize(value);
    if (!needle) return false;
    return Object.keys(row).some(function (key) {
      if (key.charAt(0) === '_') return false;
      const cell = normalize(row[key]);
      if (!cell) return false;
      return cell === needle || cell.indexOf(needle) !== -1 || needle.indexOf(cell) !== -1;
    });
  }

  function firstValue(row, candidates) {
    if (!row) return '';
    for (var i = 0; i < candidates.length; i++) {
      const direct = row[candidates[i]];
      if (String(direct || '').trim()) return String(direct).trim();
    }

    const keys = Object.keys(row);
    for (var j = 0; j < candidates.length; j++) {
      const candidate = normalize(candidates[j]);
      for (var k = 0; k < keys.length; k++) {
        if (normalize(keys[k]).indexOf(candidate) !== -1 && String(row[keys[k]] || '').trim()) {
          return String(row[keys[k]]).trim();
        }
      }
    }
    return '';
  }

  function rowToSummary(row) {
    return Object.keys(row).filter(function (key) {
      return key.charAt(0) !== '_' && String(row[key] || '').trim();
    }).slice(0, 3).map(function (key) {
      return row[key];
    }).join(' / ');
  }

  function uniqueStrings(values) {
    const seen = {};
    return values.filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function slug(value) {
    return Utilities.base64EncodeWebSafe(String(value || '')).replace(/=+$/, '');
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '').trim();
  }

  return {
    getHomeData: getHomeData,
    getClinicalView: getClinicalView,
    firstValue: firstValue,
  };
})();
