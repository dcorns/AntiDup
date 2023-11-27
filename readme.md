# AntiDup

Platform independent, interactive command line utility for Finding, renaming or removing duplicate files from a file system

## Requires node.js to be installed

[Download node for your system here](https://nodejs.org/en/download/)

## Features

- Use from the command line
- Search the file system recursively
- Optionally open each duplicate manually or automatically open each group of duplicates
- Filter search by file extension
- Creates a log file (duplicates.log) that contains the duplicate search results.

* Delete all duplicates in a specific file path in one key stroke

## Usage

### Command Line

`node AntiDup string: root of search path <string: file extension> <boolean: open duplicates automatically>`

Example:

This will search all files and directories under "/" for duplicate filenames with the .jpg extension and when listing the duplicates it will open them with the default application for inspection.

`node AntiDup / .jpg true`

The flow of the dialog would occur something like this:
