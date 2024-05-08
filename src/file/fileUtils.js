import fs from 'fs-extra';
import path from 'path';

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


/**
 * Replace all files from the depth first search based on the REPLACE_FILE_MAP
 * 
 * @param {string} folderPath 
 */
export function replaceFilenames(folderPath, replacePayload) {
  const stack = [folderPath]; // Initialize stack with the root folder

  while (stack.length > 0) {
    const currentPath = stack.pop(); // Pop the path from the end of the stack

    const contents = fs.readdirSync(currentPath);

    contents.forEach(item => {
      const itemPath = path.join(currentPath, item);
      const stat = fs.lstatSync(itemPath);

      if (stat.isDirectory()) {
        // If it's a directory, add it to the stack for processing
        stack.push(itemPath);
      } else {
        // If it's a file, check if it needs to be renamed
        const filename = path.basename(itemPath);
        if (replaceFilenames.hasOwnProperty(filename)) {
          const parentFolder = path.dirname(itemPath);
          const newName = replacePayload[filename];
          const newPath = path.join(parentFolder, newName);
          fs.renameSync(itemPath, newPath);
          console.log(`Renamed file: ${itemPath} -> ${newPath}`);
        }
      }
    });

    // Rename folder if it is in replacePayload;
    const folderBasename = path.basename(currentPath);
    if (currentPath !== folderPath && replacePayload[folderBasename]) {
      const parentFolder = path.dirname(currentPath);
      const newName = replacePayload[folderBasename];
      const newPath = path.join(parentFolder, newName);
      fs.renameSync(currentPath, newPath);
      console.log(`Renamed folder: ${currentPath} -> ${newPath}`);
    }
  }
}