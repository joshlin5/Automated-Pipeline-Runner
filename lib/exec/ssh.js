
const path = require('path');
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, sshCmd, params=new Map()) {

    // let sshExe = `ssh -i "${config.IdentifyFile}" -p ${config.Port || 22} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${config.User}@${config.HostName}`;
    if(params instanceof Map){
        for (let [key, value] of params) {
            cmd = cmd.replace(key, value);
        }
    }
    return new Promise(function (resolve, reject) { 
        console.log( chalk.yellow(`${sshCmd} ${cmd}`) );
        exec(`${sshCmd} ${cmd}`, (error, stdout, stderr) => {
            console.log(error || stderr);
            console.log(stdout);
            resolve()

        });
    });
}
