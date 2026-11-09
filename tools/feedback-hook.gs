/** LEAD feedback hook (Google Apps Script).
 *  Every feedback form sent in the hub also lands in a Google Sheet in your Drive and in your inbox.
 *
 *  Set-up, once (about five minutes):
 *   1. Go to script.google.com, signed in as yourself → New project → name it "LEAD feedback hook".
 *   2. Replace everything in the editor with this file → save.
 *   3. Deploy → New deployment → gear icon → Web app → Execute as "Me", Who has access "Anyone" → Deploy.
 *   4. Allow access when asked (Advanced → Go to LEAD feedback hook → Allow). It only touches a sheet it creates
 *      and sends mail from you to you.
 *   5. Copy the Web app URL (ends in /exec) → LEAD owner page → Feedback → paste → Save. Press "Send a test".
 *  The sheet "LEAD feedback" appears in your Drive after the first response; the URL itself shows where it is.
 */
var SHEET_NAME = "LEAD feedback";

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  if (!d || !d.title || !Array.isArray(d.answers)) return out_("ignored");
  var ss = sheet_(), tab = ss.getSheetByName(d.title) || ss.insertSheet(d.title);
  if (tab.getLastRow() === 0) {
    tab.appendRow(["When", "Name", "Level", "Center", "Signed in as", "Test?"].concat(d.answers.map(function (a) { return a.q; })));
    tab.setFrozenRows(1);
  }
  tab.appendRow([d.at ? new Date(d.at) : new Date(), d.name || "", d.role || "", d.center || "", d.by || "", d.test ? "test" : ""]
    .concat(d.answers.map(function (a) { return a.a || ""; })));
  var me = Session.getEffectiveUser().getEmail();
  var lines = d.answers.filter(function (a) { return a.a; }).map(function (a) { return a.q + "\n    " + a.a; }).join("\n\n");
  MailApp.sendEmail(me, "LEAD feedback: " + d.title + " from " + (d.name || "someone") + (d.test ? " (test)" : ""),
    (d.name || "Someone") + " (" + [d.role, d.center].filter(Boolean).join(", ") + ")\n\n" + lines + "\n\nAll responses: " + ss.getUrl());
  return out_("ok");
}

function doGet() { return out_("The LEAD feedback hook is up. Responses go to: " + sheet_().getUrl()); }

function sheet_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty("sheet");
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create(SHEET_NAME);
  p.setProperty("sheet", ss.getId());
  return ss;
}

function out_(t) { return ContentService.createTextOutput(t); }
