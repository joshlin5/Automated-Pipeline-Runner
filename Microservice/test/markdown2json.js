
const fs = require('fs');
let args = process.argv.slice(2);
let file = args[0];

let content = fs.readFileSync(file).toString();
let outFile = file.replace(/\.[^.]+$/, '.json');;
fs.writeFileSync(outFile, JSON.stringify({markdown: content}));