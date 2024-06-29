import * as fs from "fs";
import * as path from "path";
import * as zlip from "zlib";

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");


const command = process.argv[2];
// console.log(process.argv);

switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "cat-file":
    readblob();
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(path.join(process.cwd(), ".git", "HEAD"), "ref: refs/heads/main\n");
  console.log("Initialized git directory");
}

async function readblob() {
    //Get the bolb sha from input
    const bolbSha = process.argv[4];

    //format the sha to the path format
    const shaFirst = bolbSha.match(/.{1,2}/g)[0];

    //read the file from the path specified
    const shaData = fs.readFileSync(path.join(process.cwd(), ".git", "objects", shaFirst, bolbSha.slice(2)));
    // console.log(shaData);

    //unzip the sha-data
    let unzipedData = zlip.inflateSync(shaData);
    
    //may there is unzip algrithm used to compressed the data
    if (!unzipedData) unzipedData = zlip.unzipSync(shaData);
    unzipedData = unzipedData.toString()
    
    //after decompression bolb object format: blob <size>\0<content>
    //so we need to get the bolb content to log out
    unzipedData = unzipedData.split('\0')[1];


    //log out the data without the newline at the end
    process.stdout._write(unzipedData);
}