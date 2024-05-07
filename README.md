# Type Extension Manager

This is a type extension manager. It's a CLI tool that mostly replaces Platform Module Manager. Currently, it only extracts zips, but in the future it will also compress platform modules into zips.

## Installation

To run the Type Extension API using Docker, make sure you have Docker installed on your machine. It runs using node.js, so be sure to have that installed already.

1. From the folder where the code exists, install the command globally.

```bash
cd te-manager
npm install -g
```

## Usage

- `te-extract`: Extracts a zip. You can pass two parameters to it: args[0] = zipFilename; args[1] = customer. Alternatively, you can just run the te-extract command without any arguments, and it will prompt you via a CLI to perform the extract based on the current directory's zip files.
- `te-build`: Builds a zip file. By default, it will try to build the zip file form the current directory by detecting a PlatformModule.xml. If it can't find one, it will ask you via a CLI where the directory is, then create the zip file in the current directory.
