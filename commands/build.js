require('dotenv').config()
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const vmProvider = require("../lib/vmProvider");
const bakerxProvider = require("../lib/bakerxProvider");
const buildFile = path.join( path.dirname(require.main.filename), 'build.yml')
const doc = yaml.load(fs.readFileSync(buildFile, 'utf8'));

exports.command = 'build';
exports.desc = 'Trigger a build job, running steps outlined by build.yml, wait for output, and print build log.';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;
    
    console.log(chalk.green("triggering a build job"));
    let config = null;
    let provider = null;
    let vm_name = 'M1'
    if(processor == "Intel/Amd64"){
        provider = bakerxProvider
        sshCmd = provider.sshConfig(vm_name)
    }else{
        provider = vmProvider
        sshCmd = `ssh ${vm_name}`
    }
    let mysql_pssw = new Map();
    mysql_pssw.set("{mysql_pssw}", process.env["mysql_pssw"]);

    for(let i in doc.setup){
        let task = doc.setup[i];
        console.log(chalk.green(task.name));
        await provider.ssh(task.cmd, sshCmd, mysql_pssw);
    }

};