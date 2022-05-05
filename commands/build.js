require('dotenv').config()
const chalk = require('chalk');
const fs = require('fs');
const yaml = require('js-yaml');
const bakerxProvider = require("../lib/bakerxProvider");
const vmProvider = require("../lib/vmProvider");
const yamlExec = require("../lib/yamlExecutor");
const testAnalysis = require('../lib/testAnalysis');
const { env } = require('process');
exports.command = 'build <job_name> <buildFile_path>';
exports.desc = 'Trigger a build job, running steps outlined by build.yml, wait for output, and print build log.';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { job_name, buildFile_path, processor } = argv;
    
    console.log(chalk.green("triggering a build job"));
    console.log(chalk.green(`Using the yml file: ${buildFile_path}`));
    let doc = yaml.load(fs.readFileSync(buildFile_path, 'utf8'));
    let provider = null;
    let vm_name = 'M3'
    let sshCmd = '';
    if (processor == "Intel/Amd64") {
        provider = bakerxProvider
        sshCmd = await provider.sshConfig(vm_name)
    } else {
        provider = vmProvider
        sshCmd = `ssh ${vm_name}`
    }
    let envParams = new Map();
    envParams.set("{MYSQL_PSSW}", env["MYSQL_PSSW"]);
    envParams.set("{GIT_USER}", env["GIT_USER"]);
    envParams.set("{TOKEN}", env["TOKEN"]);
    envParams.set("{VOLUME}", env["VOLUME"]);

    yamlExec.initialize(provider, sshCmd, envParams);
    testAnalysis.initialize(provider, sshCmd, envParams);

    await yamlExec.runSetup(doc.setup)
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
        await yamlExec.runBuildSteps(steps);

        if ("mutation" in currentJob){
            mutation = currentJob.mutation
            let jsFile = mutation.jsfile
            let fileName = jsFile.split("/").pop();
            let microserviceDir = jsFile.replace(fileName, "");
            let oriFile = `${microserviceDir}${fileName.replace(".js", "-original.js")}`
            if(fileName.includes(".go")) {
                let oriFile = `${microserviceDir}${fileName.replace(".go", "-original.go")}`
            }
            await testAnalysis.packageInstallation(mutation.url);
            console.log(`Creating copy of original file: ${oriFile}`)
            await provider.ssh(`cp ${jsFile} ${oriFile}`, sshCmd);
            await testAnalysis.testharness(mutation, microserviceDir, oriFile);
        }
    } catch (error) {
        console.log( chalk.yellowBright (`Error ${error}`))
    }
        
    yamlExec.cleanUp(cleanup_steps);
};
