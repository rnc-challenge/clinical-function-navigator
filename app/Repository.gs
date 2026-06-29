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

  return {
    getWorkbookData: getWorkbookData,
  };
})();
