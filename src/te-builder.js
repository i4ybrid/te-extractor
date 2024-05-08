#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer-promise';
import os from 'os';
import temp from 'temp';
import { replaceFilenames } from './file/fileUtils.js';
import { zipDirectory } from './zip/zipBuilder.js';

const REPLACE_FILE_MAP = {
  "TypeExtensionD1": "$TypeExtensionD1"
};

const customerQuestion = {
  type: 'input',
  name: 'customer',
  message: 'Please enter the customer shorthand: '
};

function getFolderList(pathToCheck) {
  const items = fs.readdirSync(pathToCheck);
  const folders = items
    .filter(item => {
      const fullPath = path.join(pathToCheck, item);
      return fs.statSync(fullPath).isDirectory();
    });

  return folders;
}

/**
 * Queries the user to find the location of the folder that houses the platform module
 * 
 * @returns string
 */
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
 * Copies files in this folder to a temporary folder, renames the appropriate files based on REPLACE_FILE_MAP, and then zips it to the current working directory.
 * 
 * @param {string} platformModuleFolder 
 */
function createPlatformModuleZip(platformModuleFolder) {
  let tempDir;
  const currentDir = process.cwd();
  try {
    const platformModule = path.basename(platformModuleFolder);
    tempDir = temp.mkdirSync(platformModule);
    fs.copySync(platformModuleFolder, tempDir);
    replaceFilenames(tempDir, REPLACE_FILE_MAP);
    const zipFilename = path.join(currentDir, `${platformModule}.zip`);
  
    zipDirectory(tempDir, zipFilename).then(() => {
      console.log(`Platform Module zipped to: ${zipFilename}`);
      fs.removeSync(tempDir);
    });
  } catch(err) {
    console.error(`Caught error while creating zip.\n${err.stack}`);
    if (tempDir && fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
  }
}

function main() {
  const currentDir = process.cwd();
  const platformModuleXmlPath = path.join(currentDir, 'PlatformModule.xml');

  if (fs.existsSync(platformModuleXmlPath)) {
    console.log('PlatformModule.xml found in the current directory. Building...');
    createPlatformModuleZip(currentDir);
  } else {
    questionPlatformModuleFolder()
      .then((platformModuleFolder) => {
        console.log(`platformModuleFolder = ${platformModuleFolder}`);
        createPlatformModuleZip(platformModuleFolder);
      }).catch(err => {
        console.error('Extraction failed:', err);
        process.exit(1);
      });
  }
}

main();
