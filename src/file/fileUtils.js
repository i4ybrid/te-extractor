import fs from 'fs-extra';

// Function to retrieve zip file list sorted by modified date
export function getZipFileList() {
  const files = fs.readdirSync(process.cwd());
  const zipFiles = files
    .filter(file => file.toLowerCase().endsWith('.zip'))
    .map(file => ({
      name: file,
      modifiedDate: fs.statSync(file).mtime.getTime()
    }))
    .sort((a, b) => b.modifiedDate - a.modifiedDate)
    .map(file => file.name);

  return zipFiles;
}

export function getCustomerFileList() {
  const files = fs.readdirSync(process.cwd());
  const zipFiles = files
    .filter(file => file.toLowerCase().endsWith('.zip'))
    .map(file => ({
      name: file,
      modifiedDate: fs.statSync(file).mtime.getTime()
    }))
    .sort((a, b) => b.modifiedDate - a.modifiedDate)
    .map(file => file.name);

  return zipFiles;
}