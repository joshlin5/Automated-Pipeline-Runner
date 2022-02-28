
const path = require('path');
const os   = require('os');
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, config) {

    let sshExe = `ssh -i "${config.identifyFile}" -p ${config.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${config.user}@${config.host}`;

    return new Promise(function (resolve, reject) { 
        console.log( chalk.yellow(`${sshExe} ${cmd}`) );
        exec(`${sshExe} ${cmd}`, (error, stdout, stderr) => {

            console.log(error || stderr);
            console.log(stdout);
            resolve()

        });
    });
}
