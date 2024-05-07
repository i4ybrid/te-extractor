
import path from 'path';
import fs from 'fs-extra';

const PLATFORM_MODULE_XML_FILENAME = 'PlatformModule.xml';

export function getCustomerAndNormalizeUnitTest(folderPath) {
  const unitTestPath = findUnitTest(folderPath);
  if (!unitTestPath) {
    throw new Error(`${folderPath} doesn't seem to be a unit test folder, couldn't find a *.spec.js anywhere`);
  }

  // Store list of children in folderPath
  const originalFolderPathChildren = fs.readdirSync(folderPath);
  const unitTestFolder = path.dirname(unitTestPath);
  const unitTestParentFolder = path.dirname(unitTestFolder);

  const folderPathResolved = path.resolve(folderPath);
  const specFolderResolved = path.resolve(unitTestFolder);

  // Move contents of unitTestFolder to folderPath if they are different
  if (folderPathResolved !== specFolderResolved) {
    console.log(`getCustomerAndNormalizeUnitTest: Determined unit test exists in: ${unitTestFolder} and moving it up to the root folder`);
    moveFolderContents(unitTestFolder, folderPath);
  }

  let customerFolder;

  // Check if unitTestParentFolder is a subfolder within folderPath, to determine if there is a customer folder
  if (folderPathResolved !== path.resolve(unitTestParentFolder) && unitTestParentFolder.startsWith(folderPath)) {
    customerFolder = path.basename(unitTestParentFolder);
    console.log(`getCustomerAndNormalizeUnitTest: Determining and guessing customer is ${customerFolder}`);
  }

  if (folderPathResolved !== specFolderResolved) {
    console.log(`getCustomerAndNormalizeUnitTest: Deleting [${originalFolderPathChildren}] files/folders`);
    deleteAllFilesAndFolders(folderPath, originalFolderPathChildren);
  }

  return customerFolder;
}

/**
 * Finds the customer folder based on the location of the PlatformModule.xml file.
 *
 * This function takes a starting folder path and iteratively searches for the
 * `PlatformModule.xml` file within that folder and its subdirectories. It throws an error
 * if the file is not found. Once found, it performs the following:
 *
 * 1. Moves the contents of the folder containing `PlatformModule.xml` (typeExtensionFolder)
 *    to the provided `folderPath`.
 * 2. Identifies the parent directory of the typeExtensionFolder (teParentFolder).
 * 3. Checks if `teParentFolder` is a subfolder within `folderPath`.
 *    - If true, sets `customerFolder` to `folderPath` (becomes the customer folder).
 *    - If false, sets `customerFolder` to `teParentFolder`.
 * 4. Returns the path of the `customerFolder`.
 *
 * @param {string} folderPath - The starting folder path to search for the `PlatformModule.xml` file.
 * @returns {string} The path of the identified customer folder.
 * @throws {Error}  If the `PlatformModule.xml` file is not found anywhere within the provided path or its subdirectories.
 */
export function getCustomerAndNormalizePlatformModule(folderPath) {
  const platformModulePath = findPlatformModule(folderPath);
  if (!platformModulePath) {
    throw new Error(`${folderPath} doesn't seem to be a Platform Module folder, couldn't find ${PLATFORM_MODULE_XML_FILENAME} anywhere`);
  }

  // Store list of children in folderPath
  const originalFolderPathChildren = fs.readdirSync(folderPath);
  const typeExtensionFolder = path.dirname(platformModulePath);
  const teParentFolder = path.dirname(typeExtensionFolder);

  const folderPathResolved = path.resolve(folderPath);
  const xmlFolderResolved = path.resolve(typeExtensionFolder);

  // Move contents of typeExtensionFolder to folderPath if they are different
  if (folderPathResolved !== xmlFolderResolved) {
    console.log(`getCustomerAndNormalizePlatformModule: Determined type extension exists in: ${typeExtensionFolder} and moving it up to the root folder`);
    moveFolderContents(typeExtensionFolder, folderPath);
  }

  let customerFolder;

  // Check if teParentFolder is a subfolder within folderPath, to determine if there is a customer folder
  if (folderPathResolved !== path.resolve(teParentFolder) && teParentFolder.startsWith(folderPath)) {
    customerFolder = path.basename(teParentFolder);
    console.log(`getCustomerAndNormalizePlatformModule: Determining and guessing customer is ${customerFolder}`);
  }

  if (folderPathResolved !== xmlFolderResolved) {
    console.log(`getCustomerAndNormalizePlatformModule: Deleting [${originalFolderPathChildren}] files/folders`);
    deleteAllFilesAndFolders(folderPath, originalFolderPathChildren);
  }

  return customerFolder;
}

function deleteAllFilesAndFolders(folderPath, children) {
  for (const child of children) {
    const toBeRemoved = path.join(folderPath, path.basename(child));
    try {
      fs.removeSync(toBeRemoved);
    } catch (err) {
      if ('ENOENT' !== error.code) {
        console.error(`Couldn't remove ${toBeRemoved}, there may be extra artifacts in the folder, please manually check the result!`);
      }
    }
  }
}

/**
 * Finds the shallowest location of the `PlatformModule.xml` file within a given path and its subdirectories.
 *
 * This function uses a depth-first search approach to explore directories starting from the provided `startPath`.
 * It iterates through directories and subdirectories until the `PlatformModule.xml` file is found.
 *
 * @param {string} startPath - The starting path to begin the search for the `PlatformModule.xml` file.
 * @returns {string|null} - The full path to the `PlatformModule.xml` file if found, otherwise null.
 */
export function findUnitTest(startPath) {
  const stack = [startPath];

  while (stack.length) {
    const currentPath = stack.pop();

    const platformModule = isFolderUnitTest(currentPath);
    if (platformModule) {
      return path.join(currentPath, path.basename(platformModule));
    }

    //Didn't find the folder, so add all subfolders and recurse
    const files = fs.readdirSync(currentPath);
    const subdirectories = files.filter(file => {
      const stats = fs.statSync(path.join(currentPath, path.basename(file)));
      return stats.isDirectory();
    });

    stack.push(...subdirectories.map(dir => path.join(currentPath, path.basename(dir)))); // Push subdirectories to the stack
  }

  return null; // Not found
}

export function findPlatformModule(startPath) {
  const stack = [startPath];

  while (stack.length) {
    const currentPath = stack.pop();

    const platformModule = isFolderPlatformModule(currentPath);
    if (platformModule) {
      return path.join(currentPath, path.basename(platformModule));
    }

    //Didn't find the folder, so add all subfolders and recurse
    const files = fs.readdirSync(currentPath);
    const subdirectories = files.filter(file => {
      const stats = fs.statSync(path.join(currentPath, path.basename(file)));
      return stats.isDirectory();
    });

    stack.push(...subdirectories.map(dir => path.join(currentPath, path.basename(dir)))); // Push subdirectories to the stack
  }

  return null; // Not found
}

/**
 * Moves the contents of a source folder to a destination folder.
 *
 * This function synchronously reads the contents of the `source` folder and iterates through each file.
 * For each file, it uses `fs.renameSync` to move the file from the `source` to the `destination` folder.
 *
 * @param {string} source - The source folder path containing the files to move.
 * @param {string} destination - The destination folder path where the files will be moved.
 */
function moveFolderContents(source, destination) {
  const files = fs.readdirSync(source);
  for (const file of files) {
    const sourceFile = path.join(source, file);
    const destFile = path.join(destination, file);
    fs.renameSync(sourceFile, destFile);
  }
}

export function renameFoldersInDepthFirstOrder(folderPath) {
  const stack = [folderPath]; // Initialize stack with the root folder

  while (stack.length > 0) {
    const currentFolder = stack.pop(); // Pop the folder from the end of the queue

    // Read the contents of the current folder
    const contents = fs.readdirSync(currentFolder);

    // Process subfolders before files
    for (const item of contents) {
      const itemPath = path.join(currentFolder, item);
      const stat = fs.lstatSync(itemPath);

      if (stat.isDirectory()) {
        // If it's a directory, add it to the queue for processing
        stack.unshift(itemPath); // Add to the beginning of the queue
      }
    }

    // Rename folder if it starts with '$'
    if (currentFolder !== folderPath && path.basename(currentFolder).startsWith('$')) {
      const parentFolder = path.dirname(currentFolder);
      const newName = path.basename(currentFolder).slice(1); // Remove the leading '$'
      const newPath = path.join(parentFolder, newName);
      fs.renameSync(currentFolder, newPath);
      console.log(`Renamed folder: ${currentFolder} -> ${newPath}`);
    }
  }
}

export function isFolderUnitTest(folderPath) {
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    if (file.endsWith('.spec.js')) {
      return path.join(folderPath, file);
    }
  }
  return false; // No unit test file found
}


export function isFolderPlatformModule(folderPath) {
  const xmlPath = path.join(folderPath, PLATFORM_MODULE_XML_FILENAME);
  if (fs.existsSync(xmlPath)) {
    return xmlPath;
  } else {
    return false;
  }
}