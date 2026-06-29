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

  function getStudioContent(entryType, entryId) {
    const workbook = CfnRepository.getWorkbookData();
    const selected = findEntryItem(entryType || 'drugGroup', entryId, workbook) ||
      findEntryItem('drugGroup', entryId, workbook) ||
      findEntryItem('drugGroup', 'GLP-1受容体作動薬', workbook);
    const context = Object.assign({
      id: entryId,
      title: 'GLP-1受容体作動薬',
      relatedIds: ['DM002'],
      sourceType: entryType || 'drugGroup',
    }, selected || {});
    const drugId = (context.relatedIds && context.relatedIds[0]) || context.id || 'DM002';
    const basicInfo = buildBasicInfo(context, workbook);

    return {
      drugId: drugId,
      drugClass: context.title,
      summary: basicInfo.description,
      watchPoints: basicInfo.watchPoints,
      relatedMedicines: basicInfo.medicines,
      assessment: buildSection(workbook.Assessment_Item, context, ['確認項目', '確認すること', 'Question_or_Item', 'OutputLabel']),
      education: buildSection(workbook.Clinical_Management, context, ['患者説明', '説明項目', '説明すること', '内容']),
      safetyManagement: buildSection(workbook.Clinical_Management, context, ['対策', '受診目安', '内容']),
      multidisciplinarySupport: buildSection(workbook.Clinical_Action, context, ['内容', '支援項目', '支援すること']),
      redFlags: RiskService.getRedFlags(workbook.Red_Flag, context),
      functionalImpact: buildSection(workbook.Functional_Impact, context, ['確認コメント', '主な理由', '生活機能への影響']),
      evidence: buildDrugEvidence(workbook.Drug_Evidence, workbook.Evidence, context),
      guidelines: buildReferences(workbook.Guideline_Reference, context),
    };
  }

  function saveStudioContent(content) {
    const normalized = normalizeStudioContent(content);
    const rowSets = buildStudioRowSets(normalized);
    const result = CfnRepository.saveStudioRows(rowSets);
    return Object.assign({}, result, {
      drugId: normalized.drugId,
      drugClass: normalized.drugClass,
    });
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
    const medicines = rows.reduce(function (values, row) {
      const medicine = firstValue(row, ['薬剤名', '一般名', '商品名', 'Drug Name', 'Generic', 'Name']);
      const related = normalizeStringList(firstValue(row, ['関連薬剤']));
      if (medicine) values.push(medicine);
      return values.concat(related);
    }, []);

    return {
      title: context.title,
      description: context.description || firstValue(rows[0], ['確認の焦点', '説明', 'Description', '概要', '主な作用']) || '',
      watchPoints: buildWatchPoints(context, workbook),
      medicines: uniqueStrings(medicines).slice(0, 12),
    };
  }

  function buildWatchPoints(context, workbook) {
    const assessmentPoints = relatedRows(workbook.Assessment_Item, context).map(function (row) {
      return firstValue(row, ['OutputLabel', 'Question_or_Item', '確認項目', '確認すること']);
    });
    const functionPoints = relatedRows(workbook.Functional_Impact, context).map(function (row) {
      return firstValue(row, ['確認コメント', '主な理由', '生活機能への影響']);
    });
    const drugFocus = relatedRows(workbook.Drug_Master, context).map(function (row) {
      return firstValue(row, ['確認の焦点']);
    });

    const primaryPoints = uniqueStrings(assessmentPoints.concat(functionPoints)
      .map(toWatchPoint)
      .filter(Boolean));
    const fallbackPoints = uniqueStrings(drugFocus
      .map(toWatchPoint)
      .filter(Boolean));

    if (primaryPoints.length >= 5) {
      return primaryPoints.slice(0, 6);
    }
    return uniqueStrings(primaryPoints.concat(fallbackPoints)).slice(0, 6);
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

  function normalizeStudioContent(content) {
    content = content || {};
    return {
      drugId: String(content.drugId || 'DM002').trim(),
      drugClass: String(content.drugClass || 'GLP-1受容体作動薬').trim(),
      summary: String(content.summary || '').trim(),
      watchPoints: normalizeStringList(content.watchPoints),
      relatedMedicines: normalizeStringList(content.relatedMedicines),
      assessment: normalizeTextItems(content.assessment),
      education: normalizeTextItems(content.education),
      safetyManagement: normalizeTextItems(content.safetyManagement),
      multidisciplinarySupport: normalizeTextItems(content.multidisciplinarySupport),
      redFlags: normalizeTextItems(content.redFlags),
      functionalImpact: normalizeTextItems(content.functionalImpact),
      evidence: normalizeEvidenceItems(content.evidence),
      guidelines: normalizeTextItems(content.guidelines),
    };
  }

  function buildStudioRowSets(content) {
    const drugHeaders = ['DrugID', '分類', '薬効群', '略称', '主な作用', '服用/投与頻度', '主な適応', '確認の焦点', 'Status', 'LastUpdated', '関連薬剤'];
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const evidenceRows = content.evidence.map(function (item, index) {
      return {
        EvidenceID: item.evidenceId || content.drugId + '-EV' + padNumber(index + 1),
        'Clinical Pearl': item.clinicalPearl,
        'Evidence Memo': item.evidenceMemo,
        PMID: item.pmid,
        DOI: item.doi,
        URL: item.url,
      };
    });

    return {
      upserts: [
        {
          sheetName: 'Drug_Master',
          keyColumns: ['DrugID'],
          headers: drugHeaders,
          row: {
            DrugID: content.drugId,
            '分類': '糖尿病薬',
            '薬効群': content.drugClass,
            '確認の焦点': content.summary,
            Status: 'studio',
            LastUpdated: today,
            '関連薬剤': content.relatedMedicines.join('、'),
          },
        },
      ].concat(evidenceRows.map(function (row) {
        return {
          sheetName: 'Evidence',
          keyColumns: ['EvidenceID'],
          headers: ['EvidenceID', 'Clinical Pearl', 'Evidence Memo', 'PMID', 'DOI', 'URL'],
          row: row,
        };
      })),
      replacements: [
        {
          sheetName: 'Assessment_Item',
          matchColumn: 'DrugID',
          matchValue: content.drugId,
          headers: ['DrugID', 'Category', 'Priority', 'Question_or_Item', 'OutputLabel', 'UseInSOAP'],
          rows: content.assessment.map(function (item, index) {
            return {
              DrugID: content.drugId,
              Category: 'Assessment',
              Priority: index + 1,
              Question_or_Item: item.text,
              OutputLabel: item.label || item.text,
              UseInSOAP: 'FALSE',
            };
          }),
        },
        {
          sheetName: 'Clinical_Management',
          matchColumn: 'DrugID',
          matchValue: content.drugId,
          headers: ['DrugID', 'Priority', '症状', '対策', '患者説明', '受診目安', '職種'],
          rows: content.education.concat(content.safetyManagement).map(function (item, index) {
            return {
              DrugID: content.drugId,
              Priority: index + 1,
              '症状': item.category || '',
              '対策': item.note || '',
              '患者説明': item.text,
              '受診目安': item.category === 'Safety' ? item.text : '',
              '職種': '',
            };
          }),
        },
        {
          sheetName: 'Clinical_Action',
          matchColumn: 'DrugID',
          matchValue: content.drugId,
          headers: ['DrugID', 'ActionType', '職種', '内容', 'Priority'],
          rows: content.multidisciplinarySupport.map(function (item, index) {
            return {
              DrugID: content.drugId,
              ActionType: item.category || '支援',
              '職種': item.role || '',
              '内容': item.text,
              Priority: index + 1,
            };
          }),
        },
        {
          sheetName: 'Red_Flag',
          matchColumn: 'DrugID',
          matchValue: content.drugId,
          headers: ['DrugID', 'Severity_1to5', '内容', '推奨対応'],
          rows: content.redFlags.map(function (item) {
            return {
              DrugID: content.drugId,
              Severity_1to5: item.urgency || '',
              '内容': item.text,
              '推奨対応': item.note || '',
            };
          }),
        },
        {
          sheetName: 'Functional_Impact',
          matchColumn: 'DrugID',
          matchValue: content.drugId,
          headers: ['DrugID', 'FunctionID', 'Score_0to5', '主な理由', '確認コメント'],
          rows: content.functionalImpact.map(function (item, index) {
            return {
              DrugID: content.drugId,
              FunctionID: item.functionId || 'F' + padNumber(index + 1),
              Score_0to5: item.score || '',
              '主な理由': item.text,
              '確認コメント': item.note || item.text,
            };
          }),
        },
        {
          sheetName: 'Drug_Evidence',
          matchColumn: 'DrugID',
          matchValue: content.drugId,
          headers: ['DrugID', 'EvidenceID', 'Recommendation', 'EvidenceLevel', 'Memo'],
          rows: evidenceRows.map(function (row) {
            return {
              DrugID: content.drugId,
              EvidenceID: row.EvidenceID,
              Recommendation: row['Clinical Pearl'],
              EvidenceLevel: '',
              Memo: row['Evidence Memo'],
            };
          }),
        },
        {
          sheetName: 'Guideline_Reference',
          matchColumn: 'DrugID',
          matchValue: content.drugId,
          headers: ['DrugID', '種類', '名称', '年度', '章/項目', 'URL', 'Memo'],
          rows: content.guidelines.map(function (item) {
            return {
              DrugID: content.drugId,
              '種類': item.category || 'Guideline',
              '名称': item.text,
              '年度': '',
              '章/項目': item.note || '',
              URL: item.url || '',
              Memo: '',
            };
          }),
        },
      ],
    };
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
      const clinicalPearl = firstValue(merged, ['Clinical Pearl', 'ClinicalPearl', 'Clinical_Pearl', 'クリニカルパール']);
      const evidenceMemo = firstValue(merged, ['Evidence Memo', 'EvidenceMemo', 'Evidence_Memo', 'Memo', 'メモ']);

      return {
        id: evidenceId || slug(rowToSummary(linkRow)),
        clinicalPearl: clinicalPearl || firstValue(merged, ['Recommendation', 'KeyMessage']) || '',
        evidenceMemo: evidenceMemo || firstValue(merged, ['EvidenceLevel', 'Note', '要約', 'Summary']) || '',
        pmid: firstValue(merged, ['PMID', 'PubMed ID']),
        doi: firstValue(merged, ['DOI']),
        url: firstValue(merged, ['URL', 'Link', 'リンク']),
        evidenceId: evidenceId,
      };
    }).filter(function (item) {
      return item.clinicalPearl || item.evidenceMemo || item.pmid || item.doi || item.url;
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

  function normalizeStringList(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) {
        return String(item || '').trim();
      }).filter(Boolean);
    }
    return String(value || '').split(/\n|、|,/).map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }

  function normalizeTextItems(items) {
    if (!Array.isArray(items)) items = normalizeStringList(items).map(function (text) {
      return { text: text };
    });
    return items.map(function (item) {
      if (typeof item === 'string') return { text: item.trim() };
      return Object.assign({}, item, {
        text: String(item.text || item.title || '').trim(),
      });
    }).filter(function (item) {
      return item.text;
    });
  }

  function normalizeEvidenceItems(items) {
    if (!Array.isArray(items)) items = [];
    return items.map(function (item) {
      return {
        evidenceId: String(item.evidenceId || '').trim(),
        clinicalPearl: String(item.clinicalPearl || '').trim(),
        evidenceMemo: String(item.evidenceMemo || '').trim(),
        pmid: String(item.pmid || '').trim(),
        doi: String(item.doi || '').trim(),
        url: String(item.url || '').trim(),
      };
    }).filter(function (item) {
      return item.clinicalPearl || item.evidenceMemo || item.pmid || item.doi || item.url;
    });
  }

  function padNumber(value) {
    return String(value).padStart(3, '0');
  }

  function toWatchPoint(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    return text
      .replace(/はあるか$/, '')
      .replace(/を確認$/, '')
      .replace(/確認$/, '')
      .replace(/について$/, '')
      .replace(/[。、].*$/, '')
      .trim();
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
    getStudioContent: getStudioContent,
    saveStudioContent: saveStudioContent,
    firstValue: firstValue,
  };
})();
