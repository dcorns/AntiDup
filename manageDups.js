//Provides abilities to efficiently remove or rename duplicate files.
//filesList is an object with the following structure:
// {
//   "IMG_20210101_000000.jpg": [
//     "C:/Users/drcor/OneDrive/Pictures/IMG_20210101_000000.jpg",
//     "C:/Users/drcor/OneDrive/Pictures/IMG_20210101_000001.jpg",
//     "C:/Users/drcor/OneDrive/Pictures/IMG_20210101_000002.jpg"
//   ],
//   "20210101_000000.jpg": [
//     "/Users/drcor/OneDrive/Pictures/20210101_000000.jpg",
//     "/Users/drcor/OneDrive/Pictures/20210101_000000.jpg"
//   ]
// }
//autoOpen is a boolean value that indicates whether to automatically open files for inspection

import readline from "node:readline/promises";
import * as fs from "node:fs/promises";
import * as putils from "node:path";
import os from "node:os";
import open from "open";
const manageDups = async (filesList, autoOpen) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const deleteAll = await rl.question(
    `Would you like to delete all duplicates within a specific directory?y,[n]: `
  );
  if (deleteAll === "y") {
    console.log(
      "Warning: This will delete all files on the duplicate list, not recommended when useBytes search option is used!"
    );
    const deleteAllFromThisDirectory = await rl.question(
      `Enter the absolute path of the directory from which you would like to delete all duplicates: `
    );
    const confirmDeleteAll = await rl.question(
      `Confirm deletion of all duplicates from ${deleteAllFromThisDirectory}?y,[n]: `
    );
    if (confirmDeleteAll === "y") {
      for (const list in filesList) {
        for (const file of filesList[list]) {
          if (putils.dirname(file) === deleteAllFromThisDirectory) {
            console.log(`Deleting ${file}`);
            await fs.unlink(file);
          }
        }
      }
      rl.close();
      return;
    }
  }

  for (const list in filesList) {
    console.log(`\n${list}`);
    for (const file of filesList[list]) {
      console.log(file);
    }
    if (autoOpen) {
      for (const file of filesList[list]) {
        open(file);
      }
    }
    //need a queue here so items can be revisited
    const queue = filesList[list];
    while (queue.length) {
      const currentPath = queue[0];
      const a = await rl.question(
        `[d]elete, [s]kip, [r]ename,[c]onvert file to a link, or [o]pen this duplicate. [q]uit ${currentPath}?)[s]: `
      );
      if (a === "o") {
        open(currentPath);
      } else if (a === "d") {
        console.log(`Deleting ${currentPath}`);
        await fs.unlink(currentPath);
        queue.shift();
      } else if (a === "s") {
        queue.shift(currentPath);
      } else if (a === "r") {
        const newName = await rl.question(
          `Enter new name including extension: `
        );
        const fileName =
          os.platform(currentPath) === "win32"
            ? putils.basename
            : putils.posix.basename;
        const newPath = `${putils.dirname(currentPath)}/${newName}`;
        console.log(`Renaming ${currentPath} to ${newPath}`);
        await fs.rename(currentPath, newPath);
        queue.shift();
      } else if (a === "q") {
        rl.close();
        process.exit(1);
      } else if (a === "c") {
        //Need error handling for this since not all drives will support symbolic links
        console.log(`Not yet implemented`);
        //convert to symbolic link
        // const symLinkTarget = await rl.question(
        //   `Enter the path to the links target: `
        // );
        // console.log(`Deleting ${currentPath}`);
        //await fs.unlink(currentPath);
        // console.log(
        //   `Creating symbolic link from ${currentPath} to ${symLinkTarget}`
        // );
        // await fs.symlink(
        //   "f:/Lisa/P1010718.JPG",
        //   "f:/Ed'sFuneral/P1010718.JPG",
        //   "file"
        // );
      } else {
        //default to skip
        queue.shift(currentPath);
      }
    }
  }
  rl.close();
};

export default manageDups;
