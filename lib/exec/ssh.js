
const path = require('path');
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, config, params=new Map()) {

    let sshExe = `ssh -i "${config.identifyFile}" -p ${config.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${config.user}@${config.host}`;
    if(params instanceof Map){
        for (let [key, value] of params) {
            cmd = cmd.replace(key, value);
        }
    }
    return new Promise(function (resolve, reject) { 
        console.log( chalk.yellow(`${sshExe} ${cmd}`) );
        exec(`${sshExe} ${cmd}`, (error, stdout, stderr) => {
            console.log(error || stderr);
            console.log(stdout);
            resolve()

        });
    });
}
