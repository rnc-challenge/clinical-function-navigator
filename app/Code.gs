const CFN_SPREADSHEET_ID = '1y7a4qLjQwywC3hkC0fIBLnPfdhrYxROZYOQGqLMRMws';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Clinical Function Navigator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getHomeData() {
  return CfnService.getHomeData();
}

function getClinicalView(entryType, entryId) {
  return CfnService.getClinicalView(entryType, entryId);
}

function generateSupportNotes(payload) {
  return SOAPService.generate(payload || {});
}
