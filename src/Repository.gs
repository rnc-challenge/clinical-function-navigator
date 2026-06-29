const CFN_SHEET_NAMES = [
  'Drug_Master',
  'Functional_Impact',
  'Assessment_Item',
  'Clinical_Management',
  'Clinical_Action',
  'Red_Flag',
  'SOAP_Template',
  'Evidence',
  'Drug_Evidence',
  'Guideline_Reference',
];

const CfnRepository = (function () {
  function getWorkbookData() {
    const spreadsheet = SpreadsheetApp.openById(CFN_SPREADSHEET_ID);
    const data = {};

    CFN_SHEET_NAMES.forEach(function (sheetName) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      data[sheetName] = sheet ? readSheet(sheet) : [];
    });

    return data;
  }

  function saveStudioRows(rowSets) {
    const spreadsheet = SpreadsheetApp.openById(CFN_SPREADSHEET_ID);

    (rowSets.upserts || []).forEach(function (set) {
      upsertRow(spreadsheet, set.sheetName, set.keyColumns, set.row, set.headers);
    });

    (rowSets.replacements || []).forEach(function (set) {
      replaceRows(spreadsheet, set.sheetName, set.matchColumn, set.matchValue, set.rows, set.headers);
    });

    return {
      savedAt: new Date().toISOString(),
    };
  }

  function readSheet(sheet) {
    const values = sheet.getDataRange().getDisplayValues();
    if (!values || values.length < 2) return [];

    const headers = values[0].map(function (header, index) {
      const normalized = String(header || '').trim();
      return normalized || 'Column_' + (index + 1);
    });

    return values.slice(1)
      .filter(function (row) {
        return row.some(function (cell) {
          return String(cell || '').trim() !== '';
        });
      })
      .map(function (row, rowIndex) {
        const item = { _rowNumber: rowIndex + 2 };
        headers.forEach(function (header, index) {
          item[header] = row[index] || '';
        });
        return item;
      });
  }

  function upsertRow(spreadsheet, sheetName, keyColumns, row, fallbackHeaders) {
    const sheet = getOrCreateSheet(spreadsheet, sheetName, fallbackHeaders);
    const headers = ensureHeaders(sheet, fallbackHeaders || Object.keys(row));
    const values = sheet.getDataRange().getDisplayValues();
    const targetIndex = values.slice(1).findIndex(function (existing) {
      return keyColumns.every(function (keyColumn) {
        const columnIndex = headers.indexOf(keyColumn);
        return columnIndex >= 0 && String(existing[columnIndex] || '') === String(row[keyColumn] || '');
      });
    });
    const output = headers.map(function (header) {
      return row[header] || '';
    });

    if (targetIndex >= 0) {
      sheet.getRange(targetIndex + 2, 1, 1, headers.length).setValues([output]);
    } else {
      sheet.appendRow(output);
    }
  }

  function replaceRows(spreadsheet, sheetName, matchColumn, matchValue, rows, fallbackHeaders) {
    const sheet = getOrCreateSheet(spreadsheet, sheetName, fallbackHeaders);
    const headers = ensureHeaders(sheet, fallbackHeaders || collectHeaders(rows));
    const values = sheet.getDataRange().getDisplayValues();
    const matchIndex = headers.indexOf(matchColumn);

    if (matchIndex >= 0 && values.length > 1) {
      for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex--) {
        if (String(values[rowIndex][matchIndex] || '') === String(matchValue || '')) {
          sheet.deleteRow(rowIndex + 1);
        }
      }
    }

    if (!rows.length) return;
    const output = rows.map(function (row) {
      return headers.map(function (header) {
        return row[header] || '';
      });
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, output.length, headers.length).setValues(output);
  }

  function getOrCreateSheet(spreadsheet, sheetName, headers) {
    const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    if (sheet.getLastRow() === 0 && headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    return sheet;
  }

  function ensureHeaders(sheet, fallbackHeaders) {
    const lastColumn = Math.max(sheet.getLastColumn(), fallbackHeaders.length, 1);
    let headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(function (header) {
      return String(header || '').trim();
    });

    if (!headers.some(Boolean)) {
      headers = fallbackHeaders.slice();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      return headers;
    }

    fallbackHeaders.forEach(function (header) {
      if (headers.indexOf(header) === -1) headers.push(header);
    });

    if (headers.length > sheet.getMaxColumns()) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return headers;
  }

  function collectHeaders(rows) {
    const headers = [];
    (rows || []).forEach(function (row) {
      Object.keys(row).forEach(function (key) {
        if (headers.indexOf(key) === -1) headers.push(key);
      });
    });
    return headers;
  }

  return {
    getWorkbookData: getWorkbookData,
    saveStudioRows: saveStudioRows,
  };
})();
