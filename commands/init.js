const chalk = require('chalk');
const path = require('path');
const child = require('child_process');
const execProvider = require('../lib/exec/execProvider')

exports.command = 'init';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;
    console.log(chalk.green("Preparing computing environment..."));
    listVM = "vboxmanage list vms"
    execProvider.exec(listVM).then(result =>{
        // check if the name "M1" is used by any VM
        if(result.includes("M1")){
            console.log(chalk.green("Name 'M1' is used, remove the virtual machine..."));
            return execProvider.exec("bakerx delete vm M1");
        }
    }).then(_ =>{
        cmd = "bakerx run";
        execProvider.exec(cmd);
    })
};