
const path = require('path');
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, sshCmd, params=new Map()) {

    return new Promise(function (resolve, reject) { 
        console.log( chalk.yellow(`${sshCmd} ${cmd}`) );
        if(params instanceof Map){
            for (let [key, value] of params) {
                cmd = cmd.replaceAll(key, value);
            }
        }

        subprocess = exec(`${sshCmd} ${cmd}`, {maxBuffer: 1024 * 1024 * 1.3});

        subprocess.stdout.pipe(process.stdout);

        subprocess.stderr.pipe(process.stderr);

        subprocess.on('error', err => {
            console.log( chalk.red( err.message ) );
            reject(err);
        });
        subprocess.on('exit', code => {
            resolve(code);
        });
    });
}
