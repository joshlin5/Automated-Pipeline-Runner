require('dotenv').config()
const chalk = require('chalk');

class YamlExecutor {

    initialize(provider, sshCmd, envParams) {
        this.provider = provider;
        this.sshCmd = sshCmd;
        this.envParams = envParams
      }

    cleanUp(cleanup_steps) {
        console.log( chalk.yellowBright("\n\nCLEAN UP PROCESS") );
        for (let step in cleanup_steps){
            console.log( chalk.green(cleanup_steps[step].name) );
            this.provider.ssh(cleanup_steps[step].cmd, this.sshCmd, this.envParams);
        }
    }

    async runSetup(setup_steps) {
        for(let i in setup_steps){
            let task = setup_steps[i];
            console.log(chalk.green(task.name));
            await this.provider.ssh(task.cmd, this.sshCmd, this.envParams)
        }
    }

    async runBuildSteps(steps) {
        for (let step in steps){
            console.log( chalk.green(steps[step].name) );
            await this.provider.ssh(steps[step].cmd, this.sshCmd, this.envParams)
        }
    }

    async runDeploySteps(steps, sshCmd, envParams, inventory) {
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

module.exports = new YamlExecutor();