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

//Some aspects of code must changed based on OS
const winOS = os.platform() === "win32";
const getFileName =
  os.platform() === "win32" ? putils.basename : putils.posix.basename;

const findDups = async (root, ext, logFileName = "duplicates.log") => {

  // validate arguments, ext is optional
  if (typeof root !== "string" || (ext && typeof ext !== "string")) {
    console.log(root, ext);
    console.log(
      "Only strings are supported for the root argument and ext arguments!"
    );
    return { duplicates: null, duplicateCount: null };
  }
  const extText = ext
    ? `Only check files with the ${ext} extension.`
    : "No extension specified: check all files!";

  //Normalize Extension text: basename function does not ignore case on extensions but windows does
  if (ext) ext = ext.toLowerCase();

  const firstOccurenceOfFileName = {};
  const duplicates = {};
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
        }
      }
    } catch (e) {
      if (e.errno === -4048) console.error(`\nCannot probe ${currentPath}`);
      else console.error(e);
    }
  }

  fs.writeFile(
    "duplicates.log",
    `Total duplicate incidents: ${duplicateCount}\n` +
      JSON.stringify(duplicates, null, 2),
    "utf8"
  );
  return { duplicates, duplicateCount };
};

if (process.argv.length > 2) {
  console.log("findDups called from command line");
  const root = process.argv[2];
  const extKey = process.argv[3];
  const { duplicates, duplicateCount } = await findDups(root, extKey);
  console.log(
    `There were ${duplicateCount} duplications found in ${root} with extension ${extKey}.`
  );
  console.log('Check the file "duplicates.log" for details.');
}

export default findDups;
