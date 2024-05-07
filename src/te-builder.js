import temp from 'temp';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer-promise';
import os from 'os';
import archiver from 'archiver';

const REPLACE_FILE_MAP = {
  "TypeExtensionD1": "$TypeExtensionD1"
};

const customerQuestion = {
  type: 'input',
  name: 'customer',
  message: 'Please enter the customer shorthand: '
};

//TODO Check if current directory contains a PlatforModule.xml. If it does, just build this.

//If it doesn't, then ask the user to enter the customer shorthand
//Check if the customer folder exists. If it doesn't, exit with an error message
//If it does, then give a selector prompt for which folder to build
//Once the user selects it, copy all the contents to a temp folder
//Rename the TypeExtensionD1 to $TypeExtensionD1
//Zip the contents of the temp folder to a current folder using the original folder name as the zip filename, and zip the contents to the cwd

function getFolderList(pathToCheck) {
  const items = fs.readdirSync(pathToCheck);
  const folders = items
    .filter(item => {
      const fullPath = path.join(pathToCheck, item);
      return fs.statSync(fullPath).isDirectory();
    });

  return folders;
}

function questionPlatformModuleFolder() {
  const defaultPlatformHome = path.join(os.homedir(), 'code', 'gtnexus', 'platform');
  let customer, platformModuleFolder;
  // Step 2: If it doesn't, then ask the user to enter the customer shorthand
  const questionPromise = inquirer.question(customerQuestion)
    .then((customerResponse) => {
      customer = customerResponse?.customer ? customerResponse.customer : customerResponse;
      const customerFolder = path.join(defaultPlatformHome, 'customer', customer);
      if (customer && fs.existsSync(customerFolder)) {
        const choices = getFolderList(customerFolder);
        return inquirer.question({
          type: 'list',
          name: 'folderName',
          message: 'Select a folder to zip',
          choices: choices,
          default: (answers) => answers.folderName && choices.indexOf(answers.folderName) || 0
        }).then((folderNameResponse) => {
          const folderName = folderNameResponse?.folderName ? folderNameResponse.folderName: folderNameResponse;
          return path.join(customerFolder, folderName);
        });
      } else {
        throw new Error(`Looking for folder ${customerFolder} but it doesn't currently exist`)
      }
    });

  return questionPromise;
}

/**
 * Replace all files from the depth first search based on the REPLACE_FILE_MAP
 * 
 * @param {string} folderPath 
 */
function replaceFilenames(folderPath) {
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
        if (REPLACE_FILE_MAP.hasOwnProperty(filename)) {
          const parentFolder = path.dirname(itemPath);
          const newName = REPLACE_FILE_MAP[filename];
          const newPath = path.join(parentFolder, newName);
          fs.renameSync(itemPath, newPath);
          console.log(`Renamed file: ${itemPath} -> ${newPath}`);
        }
      }
    });

    // Rename folder if it is in REPLACE_FILE_MAP;
    const folderBasename = path.basename(currentPath);
    if (currentPath !== folderPath && REPLACE_FILE_MAP[folderBasename]) {
      const parentFolder = path.dirname(currentPath);
      const newName = REPLACE_FILE_MAP[folderBasename];
      const newPath = path.join(parentFolder, newName);
      fs.renameSync(currentPath, newPath);
      console.log(`Renamed folder: ${currentPath} -> ${newPath}`);
    }
  }
}

function zipDirectory(sourceDir, targetFile) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(targetFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
      resolve(targetFile);
    });

    archive.on('error', function (err) {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function createZip(platformModuleFolder) {
  let tempDir;
  const currentDir = process.cwd();
  try {
    const platformModule = path.basename(platformModuleFolder);
    tempDir = temp.mkdirSync(platformModule);
    fs.copySync(platformModuleFolder, tempDir);
    replaceFilenames(tempDir);
    const zipFilename = path.join(currentDir, `${platformModule}.zip`);
  
    zipDirectory(tempDir, zipFilename).then(() => {
      console.log(`Platform Module zipped to: ${zipFilename}`);
      fs.removeSync(tempDir);
    });
  } catch(err) {
    console.error(`Caught error while creating zip.\n${err.stack}`);
    if (tempDir) {
      fs.removeSync(tempDir);
    }
  }
}

function main() {
  const currentDir = process.cwd();
  const platformModuleXmlPath = path.join(currentDir, 'PlatformModule.xml');

  if (fs.existsSync(platformModuleXmlPath)) {
    console.log('PlatformModule.xml found in the current directory. Building...');
    createZip(currentDir);
  } else {
    questionPlatformModuleFolder()
      .then((platformModuleFolder) => {
        console.log(`platformModuleFolder = ${platformModuleFolder}`);
        createZip(platformModuleFolder);
      }).catch(err => {
        console.error('Extraction failed:', err);
        process.exit(1);
      });
  }
}

main();
