// Professor Lusca — Google Apps Script Backend
// Cole este código em script.google.com → novo projeto
// Depois: Implantar → Nova implantação → App da Web
// Executar como: Eu mesmo | Acesso: Qualquer pessoa
// Copie a URL gerada e cole no site (botão ☁️ Sync)

var SHEET_NAME = "alunos";

function doGet(e) {
  var action = e.parameter.action || "get";
  if (action === "ping") {
    return ContentService.createTextOutput("ok").setMimeType(ContentService.MimeType.TEXT);
  }
  // action === "get": retorna todos os alunos
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse([]);
  }
  var alunos = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      try { alunos.push(JSON.parse(data[i][1])); } catch(e) {}
    }
  }
  return jsonResponse(alunos);
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var sheet = getOrCreateSheet();

  if (body.action === "save" && body.aluno) {
    upsertAluno(sheet, body.aluno);
    return jsonResponse({ status: "saved" });
  }

  if (body.action === "delete" && body.id) {
    deleteAluno(sheet, body.id);
    return jsonResponse({ status: "deleted" });
  }

  return jsonResponse({ status: "noop" });
}

function upsertAluno(sheet, aluno) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === aluno.id) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(aluno));
      sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
      return;
    }
  }
  sheet.appendRow([aluno.id, JSON.stringify(aluno), new Date().toISOString()]);
}

function deleteAluno(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "dados_json", "atualizado_em"]);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
