require('dotenv').config()
const chalk = require('chalk');
const resemble = require("resemblejs");

class TestAnalysis {

    initialize(provider, sshCmd, envParams) {
        this.provider = provider;
        this.sshCmd = sshCmd;
        this.envParams = envParams
      }

    async testharness(mutation, microserviceDir, oriFile) {
        let targetUrls = mutation.snapshots
        let mutCnt = 0;
        let mutFailCnt = 0;
        await this.provider.ssh(`cd ${microserviceDir} && pm2 start index.js && cd`, this.sshCmd);
        await this.create_compare_screenshot(targetUrls, 'original')
        for (let i=1; i<=mutation.iterations; i++) {
            await this.runMutation(oriFile, mutation);
            await this.provider.ssh(`cd ${microserviceDir} && pm2 kill && pm2 start index.js && cd`, this.sshCmd);
            await this.create_compare_screenshot(targetUrls, i).catch( (error) => {
                mutFailCnt++;
                console.log( chalk.redBright(`\nERROR: ${error}`) );
            });
            mutCnt++;
        }
        console.log( chalk.yellowBright(`THE MUTATION COVERAGE IS: ${mutFailCnt}/${mutCnt}`));
    }

    async packageInstallation(url) {
        await this.provider.ssh(`git clone ${url}`, this.sshCmd);
        let dir_name = url.split("/").pop()
        await this.provider.ssh(`cd ${dir_name} && npm install && cd`, this.sshCmd);
    }

    async compare_screenshot(file1, file2) {
        resemble(file1).compareTo(file2).onComplete( function(comparisonData) {
            if (comparisonData.rawMisMatchPercentage > 0) {
                console.log(chalk.redBright(`The mutation file ${file2.split("/").pop()} is ${comparisonData.rawMisMatchPercentage*100}% different compared to the original page.`));
                throw "Image is not matching baseline image"
            }else{
                console.log(chalk.redBright(`The mutation file ${file2.split("/").pop()} is the same as the original page.`));
            }
        });
    }

    async create_compare_screenshot(targetUrls, picFileNameSuffix) {
        for(let j in targetUrls){
            let url = targetUrls[j];
            let picFileName = `screenshots/${url.split("/").pop()}-${picFileNameSuffix}`;
            await this.provider.ssh(`node ASTRewrite/index.js screenshot ${url} {VOLUME}/${picFileName}`, this.sshCmd, this.envParams);
            if (picFileNameSuffix != "original") {
                let originalPicFileName = picFileName.replace(`-${picFileNameSuffix}`, '-original')
                await this.compare_screenshot(`${originalPicFileName}.png`, `${picFileName}.png`)
            }
        }
    }

    async runMutation(oriFile, mutation) {
        let jsFile = mutation.jsfile
        await this.provider.ssh(`node ASTRewrite/index.js mutate ${oriFile} ${jsFile}`, this.sshCmd, this.envParams)
    }
};

module.exports = new TestAnalysis();