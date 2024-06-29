import * as fs from "fs";
import * as path from "path";
import * as zlip from "zlib";
import { createHash } from "crypto";

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

const BASE_FOLDER_PATH = path.join(process.cwd(), '.git'); //git folder path base

//get the command and the flag from the input
const command = process.argv[2];
if (process.argv[3] && process.argv[3].startsWith('-')) {global.flag = process.argv[3];}
// console.log(process.argv);

switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "cat-file":
    readBlob();
    break;
  case "hash-object":
    writeBolb();
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(BASE_FOLDER_PATH, { recursive: true });
  fs.mkdirSync(path.join(BASE_FOLDER_PATH, "objects"), { recursive: true });
  fs.mkdirSync(path.join(BASE_FOLDER_PATH, "refs"), { recursive: true });

  fs.writeFileSync(path.join(process.cwd(), ".git", "HEAD"), "ref: refs/heads/main\n");
  console.log("Initialized git directory");
}

async function readBlob() {
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


function writeBolb() {
    //get the file name from the input
    const fileName = process.argv[4];

    //read the data from the file
    const data = fs.readFileSync(fileName);
    // console.log(typeof(data));
    
    //after compression file should look like --> blob 11\0hello world
    const shaData = `blob ${data.length}\0${data}`;
    // console.log(shaData);
    //above code may change ----------------------------------------------------------------------------------

    //create a hash object to compute the sha hash of the file algorithm sha1
    const hash = createHash('sha1').update(shaData).digest('hex');
    // hash.update(data)
    // const hashVlaue = hash.digest('hex');

    process.stdout._write(hash);

    // if flag is specified as w then write the file in to the folder
    if (flag === '-w') {
        //following code will create the directory
        fs.mkdirSync(path.join(BASE_FOLDER_PATH, 'objects', hash.slice(0, 2)), { recursive: true });

        //to write a file, file name should be hash.slice(2)
        fs.writeFileSync(
            path.join(BASE_FOLDER_PATH, 'objects', hash.slice(0, 2), hash.slice(2)),
            zlip.deflateSync(shaData)
        );
    }
}