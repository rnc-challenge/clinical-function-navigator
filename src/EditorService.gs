const EditorService = (function () {
  function getContent(entryType, entryId) {
    return CfnService.getStudioContent(entryType, entryId);
  }

  function saveContent(content) {
    return CfnService.saveStudioContent(content);
  }

  return {
    getContent: getContent,
    saveContent: saveContent,
  };
})();
