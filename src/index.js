import fs from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import AdmZip from 'adm-zip';

// Function to retrieve zip file list sorted by modified date
function getZipFileList() {
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

// Function to interactively prompt user for input
async function promptUserForInput() {
  const questions = [
    {
      type: 'input',
      name: 'customerShortHand',
      message: 'Enter Customer Shorthand:'
    },
    {
      type: 'list',
      name: 'zipFilename',
      message: 'Select ZIP file to extract:',
      choices: getZipFileList(),
      default: (answers) => answers.zipFilename && getZipFileList().indexOf(answers.zipFilename) || 0
    },
    {
      type: 'list',
      name: 'isUnitTest',
      message: 'Is this a unit test?',
      choices: ['No', 'Yes'],
      default: 'No'
    }
  ];

  return inquirer.prompt(questions);
}

// Main function to extract the zip file
async function extractZip() {
  const args = process.argv.slice(2);
  let [zipFilename, customerShortHand, isUnitTest] = args;

  // Prompt user for input if parameters are missing or invalid
  if (!zipFilename || !customerShortHand || !isUnitTest) {
    const userInput = await promptUserForInput();
    zipFilename = userInput.zipFilename;
    customerShortHand = userInput.customerShortHand;
    isUnitTest = userInput.isUnitTest === 'Yes';
  }

  const zipPath = path.resolve(zipFilename);
  const defaultAppXpressHome = path.join(os.homedir(), 'code', 'gtnexus', 'platform');
  const targetDir = path.resolve(process.env.APPXPRESS_HOME || defaultAppXpressHome, customerShortHand);

  // Perform extraction (using adm-zip for extraction)
  console.log(`Extracting ${zipFilename} to ${targetDir}`);

  // Example: Using adm-zip for extraction (install via npm install adm-zip)
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(targetDir, true);

  console.log('Extraction completed successfully!');
}

// Execute the main function
extractZip().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
