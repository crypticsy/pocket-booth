/**
 * Pocket Booth — Google Apps Script upload backend.
 *
 * Deploy one copy of this script PER Google account/key that needs uploads:
 *   1. Go to script.google.com > New project, paste this file in as Code.gs
 *   2. Project Settings > Script Properties > add FOLDER_ID = <target Drive folder ID>
 *      (leave unset to upload to the account's My Drive root)
 *   3. Deploy > New deployment > type "Web app"
 *        Execute as: Me
 *        Who has access: Anyone
 *   4. Copy the deployment URL (ends in /exec) into
 *      VITE_APPS_SCRIPT_URL_<KEY> in the frontend .env.production
 *
 * Repeat with a different Google account for each key that needs its own Drive.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var image = data.image;
    var filename = data.filename;

    if (!image || !filename) {
      return jsonResponse({ success: false, error: 'Missing required fields: image and filename' });
    }

    var base64 = image.indexOf(',') !== -1 ? image.split(',')[1] : image;
    var bytes = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(bytes, getMimeType(filename), filename);

    var file = getTargetFolder().createFile(blob);

    return jsonResponse({
      success: true,
      file_id: file.getId(),
      file_name: file.getName(),
      web_view_link: file.getUrl(),
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet() {
  return jsonResponse({ status: 'ok', service: 'Pocket Booth Apps Script Uploader' });
}

function getTargetFolder() {
  var folderId = PropertiesService.getScriptProperties().getProperty('FOLDER_ID');
  return folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
}

function getMimeType(filename) {
  var lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
