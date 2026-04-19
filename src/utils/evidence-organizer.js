// utils/evidence-organizer.js
// Evidence Auto-Organizer for case files

const fs = require("fs");
const path = require("path");
const { logTelemetry } = require("./telemetry-engine");

const BASE_EVIDENCE_PATH = process.env.EVIDENCE_PATH || path.join(__dirname, "../../TrustVault/Cases");

/**
 * Organize evidence file into case folder structure
 * @param {string} caseId
 * @param {string} filename
 * @param {Buffer} fileBuffer
 * @returns {string} File path where evidence was stored
 */
function organizeEvidence(caseId, filename, fileBuffer) {
  try {
    const dateFolder = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const folderPath = path.join(
      BASE_EVIDENCE_PATH,
      `CASE-${caseId}`,
      "Evidence",
      dateFolder
    );

    // Create directory structure if it doesn't exist
    fs.mkdirSync(folderPath, { recursive: true });

    const filePath = path.join(folderPath, filename);
    fs.writeFileSync(filePath, fileBuffer);

    logTelemetry({
      type: "evidence",
      status: "stored",
      caseId,
      filename,
      path: filePath,
      size: fileBuffer.length
    });

    return filePath;
  } catch (error) {
    console.error(`Error organizing evidence for case ${caseId}:`, error);
    
    logTelemetry({
      type: "evidence",
      status: "failure",
      caseId,
      filename,
      error: error.message
    });

    throw error;
  }
}

/**
 * Get evidence folder path for a case
 * @param {string} caseId
 * @returns {string}
 */
function getEvidenceFolderPath(caseId) {
  return path.join(BASE_EVIDENCE_PATH, `CASE-${caseId}`, "Evidence");
}

/**
 * List all evidence files for a case
 * @param {string} caseId
 * @returns {Array<Object>}
 */
function listEvidenceFiles(caseId) {
  try {
    const evidencePath = getEvidenceFolderPath(caseId);
    
    if (!fs.existsSync(evidencePath)) {
      return [];
    }

    const files = [];
    const dateFolders = fs.readdirSync(evidencePath);

    dateFolders.forEach(dateFolder => {
      const datePath = path.join(evidencePath, dateFolder);
      if (fs.statSync(datePath).isDirectory()) {
        const dateFiles = fs.readdirSync(datePath);
        dateFiles.forEach(file => {
          const filePath = path.join(datePath, file);
          const stats = fs.statSync(filePath);
          files.push({
            filename: file,
            date: dateFolder,
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          });
        });
      }
    });

    return files.sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error(`Error listing evidence for case ${caseId}:`, error);
    return [];
  }
}

module.exports = {
  organizeEvidence,
  getEvidenceFolderPath,
  listEvidenceFiles
};
