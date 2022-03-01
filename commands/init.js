const chalk = require('chalk');
const path = require('path');
const child = require('child_process');
const execProvider = require('../lib/exec/execProvider');
const builder = require('../lib/builder');

exports.command = 'init <vm_name>';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { vm_name, processor } = argv;
    console.log(chalk.green("Preparing computing environment..."));
    if( processor === "Arm64" ) {
        return await builder.initializeVirtualMachine(vm_name, "ubuntu:focal");
    }
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
