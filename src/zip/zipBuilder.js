import archiver from 'archiver';
import fs from 'fs-extra';

export function zipDirectory(sourceDir, targetFile) {
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