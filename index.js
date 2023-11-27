#!/usr/bin/env node
import findDups from "./findDups.js";
import manageDups from "./manageDups.js";
//findDups.js is a function that takes a root directory and an optional extension as arguments
if (process.argv.length > 2) {
  console.log("Anti Duplicator called from command line");
  const root = process.argv[2];
  const extKey = process.argv[3];
  const autoOpen = process.argv[4] || false;
  const logFileName = process.argv[5] || "duplicates.log";
  const { duplicates, duplicateCount } = await findDups(
    root,
    extKey,
    logFileName
  );
  console.log(
    `There were ${duplicateCount} duplications found in ${root} with extension ${extKey}.`
  );
  console.log('Check the file "duplicates.log" for details.');
  //manageDups.js is a function that takes the duplicates object returned by findDups.js
  //and a optional boolean value to indicate whether to automatically open files for inspection
  // allowing the user to delete, skip, or open(with default application) duplicate files
  if (duplicateCount > 0) await manageDups(duplicates, autoOpen);
} else {
  console.log(
    "Please provide a root directory and optional file extension to search for duplicates"
  );
  console.log("Example: node index.js C:/Users/username/Documents .txt");
  console.log(
    "you can also open duplicate files automatically with the default application by adding 'true' as a third argument"
  );
}
