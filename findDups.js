// Purpose: Find duplicate files in a directory tree.
// Author: Dale Corns
// Date: 2021-08-28
// License: MIT License
// Usage: node findDups.js <root> <ext>
//   <root> is the directory to start the search
//   <ext> is the extension of files to search for duplicates
//   If <ext> is not specified, all files will be searched for duplicates
//   If <ext> is specified, it must be in the form of a file extension, e.g. .txt
// Can be called from the command line or imported as a module

import * as fs from "node:fs/promises";
import * as putils from "node:path";
import os from "node:os";
import imageSize from "image-size";
import path from "path";

//Some aspects of code must changed based on OS
const winOS = os.platform() === "win32";
const getFileName =
  os.platform() === "win32" ? putils.basename : putils.posix.basename;

let findDups = async (
  root,
  ext,
  logFileName = "duplicates.log",
  usePixels = false
) => {
  console.log("findDups called");

  // validate arguments, ext is optional
  if (usePixels === "false") usePixels = false;
  if (logFileName === "null") logFileName = "duplicates.log";
  console.log(
    `root: ${root}, ext: ${ext}, logFileName: ${logFileName}, usePixels: ${usePixels}`
  );
  if (typeof root !== "string" || (ext && typeof ext !== "string")) {
    console.log(root, ext);
    console.log(
      "Only strings are supported for the root argument and ext arguments!"
    );
    return { duplicates: null, duplicateCount: null };
  }
  const extText = ext
    ? `Only check files with the ${ext} extension.`
    : "No extension specified: checking all files! This may take a while!";

  //Normalize Extension text: basename function does not ignore case on extensions but windows does
  if (ext) ext = ext.toLowerCase();

  const firstOccurenceOfFileName = {};
  const duplicates = {};
  const pixelsChecked = {};
  // Use a queue to traverse the directory tree
  const queue = [root];
  let duplicateCount = 0;
  while (queue.length) {
    const currentPath = queue.shift();
    try {
      const stat = await fs.stat(currentPath);
      if (stat.isDirectory()) {
        process.stdout.write(`\nChecking Files in ${currentPath}`);
        //Add all files and directories to the queue
        const files = await fs.readdir(currentPath);
        for (const file of files) {
          queue.push(`${currentPath}/${file}`);
          process.stdout.write(".");
        }
      } else if (stat.isFile()) {
        //If an extension was specified, only check files with that extension and ignore symbolic links
        if (ext && putils.extname(currentPath).toLowerCase() !== ext) continue;
        if (!stat.isSymbolicLink()) {
          const fileName = getFileName(currentPath);
          if (!usePixels) {
            console.log("Executing without pixels");
            //Check for duplicate file names using firstOccurenceOfFileName and duplicates objects
            if (duplicates[fileName]) {
              duplicates[fileName].push(currentPath);
              duplicateCount++;
            } else if (firstOccurenceOfFileName[fileName]) {
              duplicates[fileName] = [
                firstOccurenceOfFileName[fileName],
                currentPath,
              ];
              duplicateCount++;
            } else {
              firstOccurenceOfFileName[fileName] = currentPath;
            }
          } else {
            pixelsChecked[currentPath] = true;
            //Note: here we assume that all images have a valid extension. Images that do not have a matching extension will not be compared.
            const pixelExt = putils.extname(currentPath).toLowerCase();
            const image1Path = currentPath;
            const image1 = await fs.readFile(image1Path);

            let pixelQueue = [...queue];

            while (pixelQueue.length) {
              const currentPixelPath = pixelQueue.shift();
              const stat = await fs.stat(currentPixelPath);
              if (stat.isDirectory()) {
                process.stdout.write(`\nChecking Files in ${currentPixelPath}`);
                //Add all files and directories to the queue
                const files = await fs.readdir(currentPixelPath);
                for (const file of files) {
                  if (putils.extname(file).toLowerCase() === pixelExt)
                    pixelQueue.push(`${currentPixelPath}/${file}`); //only add files with matching extension to pixelQueue
                  process.stdout.write(".");
                }
              } else if (stat.isFile()) {
                if (
                  !pixelsChecked[currentPixelPath] &&
                  putils.extname(currentPixelPath).toLowerCase() === pixelExt
                ) {
                  const image2Path = currentPixelPath;
                  const image1Stat = await fs.stat(image1Path);
                  const image2Stat = await fs.stat(image2Path);
                  if (image1Stat.size === image2Stat.size) {
                    console.log("file sizes match");
                    const image1Data = await fs.readFile(image1Path);
                    const image2Data = await fs.readFile(image2Path);
                    const result = Buffer.compare(image1Data, image2Data);
                    if (result === 0) {
                      if (duplicates[image1Path]) {
                        duplicates[image1Path].push(image2Path);
                        duplicateCount++;
                      } else {
                        duplicates[image1Path] = [image1Path, image2Path];
                        duplicateCount++;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      if (e.errno === -4048) console.error(`\nCannot probe ${currentPath}`);
      else console.error(e);
    }
  }
  console.log("Writing log file");
  console.log(logFileName);
  fs.writeFile(
    logFileName,
    `Total duplicate incidents: ${duplicateCount}\n` +
      JSON.stringify(duplicates, null, 2),
    "utf8"
  );
  return { duplicates, duplicateCount };
};
const thisModuleName = path.parse(import.meta.url).name;
const callingModuleName = path.parse(process.argv[1]).name;
if (thisModuleName === callingModuleName && process.argv.length > 2) {
  console.log("findDups called from command line");
  const root = process.argv[2];
  const extKey = process.argv[3];
  const logFileName = process.argv[4] || "duplicates.log";
  const usePixels = process.argv[5] || false;
  const { duplicates, duplicateCount } = await findDups(
    root,
    extKey,
    logFileName,
    usePixels
  );
  console.log(
    `\r${duplicateCount} duplication/s found in ${root} with extension ${extKey}.`
  );
  console.log(`Check the file ${logFileName} for details.`);
}

export default findDups;
