require('dotenv').config()
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const vmProvider = require("../lib/vmProvider");
const bakerxProvider = require("../lib/bakerxProvider");
const buildFile = path.join( path.dirname(require.main.filename), 'build.yml')
const doc = yaml.load(fs.readFileSync(buildFile, 'utf8'));
exports.command = 'build <job_name> <path of build.yml>';
exports.desc = 'Trigger a build job, running steps outlined by build.yml, wait for output, and print build log.';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { job_name, build_yml, processor } = argv;
    
    console.log(chalk.green("triggering a build job"));
    let provider = null;
    let vm_name = 'M1'
    let sshCmd = '';
    if(processor == "Intel/Amd64"){
        provider = bakerxProvider
        sshCmd = await provider.sshConfig(vm_name)
    }else{
        provider = vmProvider
        sshCmd = `ssh ${vm_name}`
    }
    let envParams = new Map();
    envParams.set("{MYSQL_PSSW}", process.env["MYSQL_PSSW"]);
    envParams.set("{MYSQL_USER}", process.env["MYSQL_USER"]);
    envParams.set("{GIT_USER}", process.env["GIT_USER"]);
    envParams.set("{TOKEN}", process.env["TOKEN"]);

    for(let i in doc.setup){
        let task = doc.setup[i];
        console.log(chalk.green(task.name));
        await provider.ssh(task.cmd, sshCmd, envParams);
    }

    for(let i in doc.jobs){
        if (doc.jobs[i].name === job_name){
            let steps = doc.jobs[i].steps
            for (let j in steps){
                console.log( chalk.green(steps[j].name) )
                await provider.ssh(steps[j].cmd, sshCmd, envParams);
            }
        }
    }

};