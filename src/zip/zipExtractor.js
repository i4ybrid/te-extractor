import AdmZip from 'adm-zip';
import path from 'path';
import temp from 'temp';

export function extractZip(zipFilename, targetDir) {
  // Perform extraction (using adm-zip for extraction)
  console.log(`Extracting ${zipFilename} to ${targetDir}`);
  const zipPath = path.resolve(zipFilename);

  // Example: Using adm-zip for extraction (install via npm install adm-zip)
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(targetDir, true);
}

export function extractZipToTemp(zipFilename) {
  const tempDir = temp.mkdirSync(zipFilename);
  extractZip(zipFilename, tempDir);

  return tempDir;
}