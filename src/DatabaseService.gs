const DatabaseService = (function () {
  function readAll() {
    return CfnRepository.getWorkbookData();
  }

  function saveStudioRows(rowSets) {
    return CfnRepository.saveStudioRows(rowSets);
  }

  return {
    readAll: readAll,
    saveStudioRows: saveStudioRows,
  };
})();
