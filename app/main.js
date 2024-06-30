import * as fs from "fs";
import * as path from "path";
import * as zlip from "zlib";
import { createHash } from "crypto";


const BASE_FOLDER_PATH = path.join(process.cwd(), '.git'); //git folder path base

//get the command and the flag from the input
const command = process.argv[2];
if (process.argv[3] && process.argv[3].startsWith('-')) {global.flag = process.argv[3];}
;

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
  case "ls-tree":
    readTree();
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


    //unzip the sha-data
    let unzipedData = zlip.inflateSync(shaData);
    
    //may there is unzip algrithm used to compressed the data
    if (!unzipedData) unzipedData = zlip.unzipSync(shaData);
    unzipedData = unzipedData.toString()
    
    //after decompression bolb object format: blob <size>\0<content>
    unzipedData = unzipedData.split('\0')[1];


    //log out the data without the newline at the end
    process.stdout._write(unzipedData);
}


function writeBolb() {
    //get the file name from the input
    const fileName = process.argv[4];

    //read the data from the file
    const data = fs.readFileSync(fileName);
    
    //after compression file should look like --> blob 11\0hello world
    const shaData = `blob ${data.length}\0${data}`;

    //create a hash object to compute the sha hash of the file algorithm sha1
    const hash = createHash('sha1').update(shaData).digest('hex');


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


function readTree() {
    if (flag === '--name-only') {
        //get the <tree_sha> from the input
        const treeSha = process.argv[4];

        //get the file path from that sha
        const compressedData = fs.readFileSync(path.join(BASE_FOLDER_PATH, 'objects', treeSha.slice(0,2), treeSha.slice(2)));
        
        //decompress the file
        const decompressData = zlip.inflateSync(compressedData);

        
        //convert to string and split and get the file names 
        let treeData = decompressData.toString().split(' ');
        treeData = treeData.slice(2);
        const fileNames = [];
        treeData.forEach(name => {
            fileNames.push(name.split('\0')[0]);
        });
        
        fileNames.forEach(fileName => console.log(fileName));
        
        /* 
        tree <size>\0<mode> <name>\0<20_byte_sha><mode> <name>\0<20_byte_sha>
        */
    }
}