require('dotenv').config()
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const resemble = require("resemblejs");
const yaml = require('js-yaml');
const vmProvider = require("../lib/vmProvider");
const bakerxProvider = require("../lib/bakerxProvider");
const testharness = require("../ASTRewrite/commands/testharness");

const { async } = require('hasbin');
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
    let vm_name = 'M2'
    let sshCmd = '';
    if (processor == "Intel/Amd64") {
        provider = bakerxProvider
        sshCmd = await provider.sshConfig(vm_name)
    } else {
        provider = vmProvider
        sshCmd = `ssh ${vm_name}`
    }
    let envParams = new Map();
    envParams.set("{MYSQL_PSSW}", process.env["MYSQL_PSSW"]);
    envParams.set("{GIT_USER}", process.env["GIT_USER"]);
    envParams.set("{TOKEN}", process.env["TOKEN"]);
    envParams.set("{VOLUME}", process.env["VOLUME"]);

    await runSetup(doc.setup)
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
        await runBuildSteps(steps);

        if ("mutation" in currentJob){
            mutation = currentJob.mutation
            let jsFile = mutation.jsfile
            let fileName = jsFile.split("/").pop();
            let microserviceDir = jsFile.replace(fileName, "");
            let oriFile = `${microserviceDir}${fileName.replace(".js", "-original.js")}`
            let targetUrls = mutation.snapshots
            let mutCnt = 0;
            let mutFailCnt = 0;
            await packageInstallation(mutation.url);
            console.log(`Creating copy of original file: ${oriFile}`)
            await provider.ssh(`cp ${jsFile} ${oriFile}`, sshCmd);
            await provider.ssh(`cd ${microserviceDir} && pm2 start index.js && cd`, sshCmd);
            await create_compare_screenshot(targetUrls, 'original')
            for (let i=1; i<=mutation.iterations; i++) {
                await runMutation(oriFile, mutation);
                await provider.ssh(`cd ${microserviceDir} && pm2 restart index.js && cd`, sshCmd);
                await create_compare_screenshot(targetUrls, i).catch( (error) => {
                    mutFailCnt++;
                    console.log( chalk.yellowBright(`\nERROR: ${error}`) );
                });
                mutCnt++;
            }
            console.log( chalk.yellowBright(`THE MUTATION COVERAGE IS: ${mutFailCnt}/${mutCnt}`));
            cleanUp(cleanup_steps);
        }
    } catch (error) {
        console.log( chalk.yellowBright (`Error ${error}`))
        cleanUp(cleanup_steps)
    }
    

    function cleanUp(cleanup_steps) {
        console.log( chalk.yellowBright("\n\nCLEAN UP PROCESS") );
        for (let step in cleanup_steps){
            console.log( chalk.green(cleanup_steps[step].name) );
            provider.ssh(cleanup_steps[step].cmd, sshCmd, envParams);
        }
    }

    async function runBuildSteps(steps) {
        for (let step in steps){
            console.log( chalk.green(steps[step].name) );
            await provider.ssh(steps[step].cmd, sshCmd, envParams)
        }
    }

    async function runSetup(setup_steps) {
        for(let i in setup_steps){
            let task = setup_steps[i];
            console.log(chalk.green(task.name));
            await provider.ssh(task.cmd, sshCmd, envParams)
        }
    }

    async function packageInstallation(url) {
        await provider.ssh(`git clone ${url}`, sshCmd);
        dir_name = url.split("/").pop()
        console.log(chalk.red(dir_name))
        await provider.ssh(`cd ${dir_name} && npm install && cd`, sshCmd);
    }

    async function compare_screenshot(file1, file2) {
        // await provider.ssh(`astrewrite testharness ${file1} ${file2}`, sshCmd, envParams);
        resemble(file1).compareTo(file2).onComplete( function(comparisonData) {
            if (comparisonData.misMatchPercentage >= 0) {
                console.log(file2.split("/").pop(), comparisonData.misMatchPercentage);
                throw `Mismatch Percentage is: ${comparisonData.misMatchPercentage}`
            };
        });
    }

    async function create_compare_screenshot(targetUrls, picFileNameSuffix) {
        for(let j in targetUrls){
            let url = targetUrls[j];
            console.log(`url: ${url}`)
            let picFileName = `{VOLUME}/screenshots/${url.split("/").pop()}-${picFileNameSuffix}`;
            await provider.ssh(`node ~/ASTRewrite/index.js screenshot ${url} ${picFileName}`, sshCmd, envParams);
            // await testharness.checkServerReady(url);
            // console.log(`pic file: ${picFileName}`)
            // await testharness.screenshot(url, picFileName);
            if (picFileNameSuffix != "original") {
                originalPicFileName = picFileName.replace(`-${picFileNameSuffix}$`, '-original')
                await compare_screenshot(originalPicFileName, picFileName)
            }
        }
    }
    
    async function runMutation(oriFile, mutation) {
        jsFile = mutation.jsfile
        await provider.ssh(`node ~/ASTRewrite/index.js mutate ${oriFile} ${jsFile}`, sshCmd);
        // await testharness.rewrite(oriFile, jsFile)
    }
};
