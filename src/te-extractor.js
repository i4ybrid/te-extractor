#!/usr/bin/env node
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import inquirer from 'inquirer-promise';
import { getZipFileList } from './file/fileUtils.js';
import { extractZipToTemp } from './zip/zipExtractor.js';
import { findPlatformModule, getCustomerAndNormalizeUnitTest, getCustomerAndNormalizePlatformModule, renameFoldersInDepthFirstOrder, findUnitTest } from './zip/zipAnalyzer.js';

const zipFiles = getZipFileList();

const zipFilenameQuestion = {
  type: 'list',
  name: 'zipFilename',
  message: 'Select ZIP file to extract:',
  choices: zipFiles,
  default: (answers) => answers.zipFilename && zipFiles.indexOf(answers.zipFilename) || 0
};

const unitTestQuestion = {
  type: 'list',
  name: 'isUnitTest',
  message: 'Is this a unit test?',
  choices: ['No', 'Yes'],
  default: 'No'
}

const customerQuestion = {
  type: 'input',
  name: 'customer',
  message: 'Please enter the customer shorthand: '
}

function extractParameters(args) {
  return new Promise((resolve) => {
    let [zipFilename, customer] = args;
    resolve({ zipFilename, customer });
  })
}
// Execute the main function
function main() {
  let zipFilename, isUnitTest, customer, tempDir;

  return extractParameters(process.argv.slice(2))
    .then((args) => {
      zipFilename = args.zipFilename;
      customer = args.customer;
      if (!zipFilename) {
        return inquirer.prompt(zipFilenameQuestion);
      } else {
        return zipFilename;
      }
    }).then((zipFilenameResponse) => {
      zipFilename = zipFilenameResponse?.zipFilename ? zipFilenameResponse.zipFilename : zipFilenameResponse;
      tempDir = extractZipToTemp(zipFilename);
      const guessedIsUnitTest = findUnitTest(tempDir);
      const guessedIsPlatformModule = findPlatformModule(tempDir);
      if (guessedIsUnitTest) {
        console.log(`Analyzed folder, and assuming this is a unit test`);
        isUnitTest = 'Yes';
      } else if (guessedIsPlatformModule) {
        console.log(`Analyzed folder, and it appears to be a platform module`);
        isUnitTest = 'No';
      } else {
        throw Error(`${zipFilename} doesn't appear to be a platform module nor a unit test. Please be sure there is either a PlatformModule.xml in the zip, or a *.spec.js file in the zip`)
      }

      let customerFolder;
      if ('Yes' === isUnitTest) {
        customerFolder = getCustomerAndNormalizeUnitTest(tempDir);
      } else {
        customerFolder = getCustomerAndNormalizePlatformModule(tempDir);
      }
      if (!customer && !customerFolder) {
        return inquirer.prompt(customerQuestion);
      } else if (!customer && customerFolder) {
        console.log(`Analyzed zip and determined customer is ${customerFolder}`);
        customer = customerFolder;
        return customer;
      } else {
        return customer;
      }
    }).then((customerResponse) => {
      customer = customerResponse?.customer ? customerResponse.customer : customerResponse;
      renameFoldersInDepthFirstOrder(tempDir);

      const zipFilenameWithoutExtension = path.parse(zipFilename).name;
      const platformModuleName = zipFilenameWithoutExtension.endsWith('UnitTest') ? zipFilenameWithoutExtension.slice(0, -'UnitTest'.length) : zipFilenameWithoutExtension;

      const defaultPlatformHome = path.join(os.homedir(), 'code', 'gtnexus', 'platform');
      const targetDir = isUnitTest === 'Yes' ?
        path.resolve(process.env.PLATFORM_HOME || defaultPlatformHome, 'test', 'customer', customer, platformModuleName) :
        path.resolve(process.env.PLATFORM_HOME || defaultPlatformHome, 'customer', customer, platformModuleName);

      console.log(`Completing with payload: ${JSON.stringify({ zipFilename, isUnitTest, customer })}`);
      console.log(`Copying folder: ${tempDir} -> ${targetDir}`);
      fs.ensureDirSync(targetDir);
      return fs.copySync(tempDir, targetDir);
    }).catch(err => {
      console.error('Extraction failed:', err);
      process.exit(1);
    }).finally(() => {
      if (tempDir) {
        fs.removeSync(tempDir);
      }
    });
}

main();
