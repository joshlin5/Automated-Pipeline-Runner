require('dotenv').config()
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const resemble = require("resemblejs");
const readline = require("readline")
const yaml = require('js-yaml');
const build = require('./build.js');
const vmProvider = require("../lib/vmProvider");
const bakerxProvider = require("../lib/bakerxProvider");
exports.command = 'deploy <inventory_path> <job_name> <buildFile_path>';
exports.desc = 'Trigger a deploy job, running steps outlined by build.yml, wait for output, and print build log.';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { inventory_path, job_name, buildFile_path, processor } = argv;
    
    console.log(chalk.green("triggering a deploy job"));
    console.log(chalk.green(`Using the yml file: ${buildFile_path}`));
    console.log(chalk.green(`Using the inventory file: ${inventory_path}`));
    let doc = yaml.load(fs.readFileSync(buildFile_path, 'utf8'));
    let inventory = readInventory(inventory_path);
    let sshCmd = sshConfig(inventory);
    
    let provider = null;
    if (processor == "Intel/Amd64") {
        provider = bakerxProvider
    } else {
        provider = vmProvider
    }
    let envParams = new Map();
    envParams.set("{MYSQL_PSSW}", process.env["MYSQL_PSSW"]);
    envParams.set("{GIT_USER}", process.env["GIT_USER"]);
    envParams.set("{TOKEN}", process.env["TOKEN"]);
    envParams.set("{VOLUME}", process.env["VOLUME"]);

    // check if the iTrust2-10.jar exists
    let iTrust2 = path.join(__dirname, '../iTrust2-10.jar');
    if(!fs.existsSync(iTrust2)){
        let isBuild = await askBuild();
        if(isBuild === 'Y'){
            console.log(chalk.green("Start to build the project"));
            let buildParams = {
                'job_name': 'itrust-build',
                'buildFile_path': buildFile_path,
                'processor': processor
            }
            await build.handler(buildParams);
        }else{
            console.log(chalk.yellow(`Please run 'node index.js build itrust-build ${buildFile_path}' before the deployment`));
            return
        }
    }

    await runSetup(doc.setup, sshCmd, envParams)
    console.log( chalk.yellowBright( "\nINSTALLATION COMPLETE! TRIGGERING JOB EXECUTION" ))
    let currentJob = null

    for(let job in doc.jobs){ 
        if (doc.jobs[job].name === job_name){
            currentJob = doc.jobs[job]
        }
    }

    let steps = currentJob.steps;
    let cleanup_steps = currentJob.cleanup;

    try {
        await runDeploySteps(steps, sshCmd, envParams, inventory);
    } catch (error) {
        console.log( chalk.yellowBright (`Error ${error}`))
    }
    cleanUp(cleanup_steps, sshCmd, envParams);

    function askBuild() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    
        return new Promise(resolve => rl.question("Application has not been built yet, do you want to build and deploy? (Y/n)", ans => {
            rl.close();
            resolve(ans);
        }))
    }

    function readInventory(inventoryPath){
        let file = fs.readFileSync(inventoryPath, 'utf8');
        let lines = file.replaceAll("\"","").split("\n");
        let inventory={};
        for(let i in lines){
            let line = lines[i];
            let params = line.split(/\s*=\s*/);
            inventory[params[0]] = params[1];
        }
        return inventory;
    }

    function sshConfig(inventory) {
        return `ssh -q -i "${inventory.IDENTIFY_FILE}" -p ${inventory.PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${inventory.USER}@${inventory.HOST}`;
    }

    function cleanUp(cleanup_steps, sshCmd, envParams) {
        console.log( chalk.yellowBright("\n\nCLEAN UP PROCESS") );
        for (let step in cleanup_steps){
            console.log( chalk.green(cleanup_steps[step].name) );
            provider.ssh(cleanup_steps[step].cmd, sshCmd, envParams);
        }
    }

    async function runSetup(setup_steps, sshCmd, envParams) {
        for(let i in setup_steps){
            let task = setup_steps[i];
            console.log(chalk.green(task.name));
            await provider.ssh(task.cmd, sshCmd, envParams)
        }
    }

    async function runDeploySteps(steps, sshCmd, envParams, inventory) {
        for (let step in steps){
            console.log( chalk.green(steps[step].name) );
            if(steps[step].cmd){
                await provider.ssh(steps[step].cmd, sshCmd, envParams)
            }else if(steps[step].scp){
                let params = steps[step].scp.params;
                await provider.scp(params.src, params.dest, inventory)
            }
            
        }
    }
};
