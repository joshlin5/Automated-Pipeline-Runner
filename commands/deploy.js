require('dotenv').config()
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const readline = require("readline")
const yaml = require('js-yaml');
const build = require('./build');
const bakerxProvider = require("../lib/bakerxProvider");
const vmProvider = require("../lib/vmProvider");
const ymlExec = require('../lib/yamlExecutor');
const {serverNames, run} = require("../lib/blueGreenStrategy");
const { env } = require('process');
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
    readInventory(inventory_path);

    let provider = null;
    if (processor == "Intel/Amd64") {
        provider = bakerxProvider
    } else {
        provider = vmProvider
    }
    let envParams = new Map();
    envParams.set("{MYSQL_PSSW}", env["MYSQL_PSSW"]);
    envParams.set("{GIT_USER}", env["GIT_USER"]);
    envParams.set("{TOKEN}", env["TOKEN"]);
    envParams.set("{VOLUME}", env["VOLUME"]);

    // check if the iTrust2-10.jar exists
    let iTrust2 = path.join(__dirname, '../iTrust2-10.jar');
    if(!fs.existsSync(iTrust2)){
        let isBuild = await askBuild("Application has not been built yet, do you want to build and deploy? (Y/n)");
        let buildJob = await askBuild("Give the job name to build")
        if(isBuild.toLowerCase() === 'y'){
            console.log(chalk.green("Start to build the project"));
            let buildParams = {
                'job_name': buildJob,
                'buildFile_path': buildFile_path,
                'processor': processor
            }
            await build.handler(buildParams);
        }else{
            console.log(chalk.yellow(`Please run 'node index.js build ${buildJob} ${buildFile_path}' before the deployment`));
            return
        }
    }

    let currentJob = null

    for(let job in doc.jobs){ 
        if (doc.jobs[job].name === job_name){
            currentJob = doc.jobs[job]
        }
    }

    let steps = currentJob.steps;
    let cleanup_steps = currentJob.cleanup || [];

    for (let server in serverNames) {
        let sshCmd = sshConfig(serverNames[server]);

        ymlExec.initialize(provider, sshCmd, envParams);

        await ymlExec.runSetup(doc.setup)
        console.log( chalk.yellowBright( `\nINSTALLATION COMPLETE ON ${server} server` ))
        try {
            console.log( chalk.yellowBright( `\nRUN DEPLOY STEPS ON ${server} server` ))
            await ymlExec.runDeploySteps(steps, serverNames[server]);
        } catch (error) {
            console.log( chalk.red (`Error ${error}`))
        }
        ymlExec.cleanUp(cleanup_steps);
    }

    await run()

    function askBuild(ques) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    
        return new Promise(resolve => rl.question(ques, ans => {
            rl.close();
            resolve(ans);
        }))
    }

    function readInventory(inventoryPath){
        let file = fs.readFileSync(inventoryPath, 'utf8');
        let lines = file.replaceAll("\"","").trim().split("\n");
        let serverName = "";
        for(let i in lines){
            let line = lines[i];
            let params = line.split(/\s* \s*/);
            if (!params[0].startsWith("\t")){
                serverName = params[1];
            } else {
                serverNames[serverName][params[0].trim()] = params[1];
            }
        }
    }

    function sshConfig(inventory) {
        return `ssh -i ${env["PROVISION_PRIVATE_PATH"]} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${inventory.USER}@${inventory.HOSTIP}`
    }
};
