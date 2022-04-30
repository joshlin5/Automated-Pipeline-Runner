const chalk = require('chalk');
const child = require('child_process');
const fs = require('fs');
const sshExec = require('./exec/ssh')
const path = require('path');
const execProvider = require('./exec/ExecProvider');
const scpSync= require('./exec/scp');

class VMProvider {

    sshConfig(vmName) {
        let localConfigPath = path.join(path.dirname(require.main.filename), "config.txt")
        let sshConfigPath = '~/.ssh/config'
        let includeLine = `Include ${localConfigPath}`
        let getIpCmd = `vm ssh-config ${vmName}`;
        let sshConfigFileCmds = `touch ~/.ssh/config;chmod 600 ~/.ssh/config`
        let sshIncludeCmd = `grep -qxF '${includeLine}' ${sshConfigPath} || echo "${includeLine}\n$(cat ${sshConfigPath})" > ${sshConfigPath}`
        
        console.log(chalk.green( 'insert ssh config of VM to local ssh config file' ));
        return execProvider.exec(`${getIpCmd} | awk 'NF' > ${localConfigPath}`).then(std => {
            let config = '\tIdentityFile "~/Library/Application\ Support/basicvm/key"' + 
            '\n\tStrictHostKeyChecking no\n\tUserKnownHostsFile /dev/null' 
            console.log(chalk.green( 'append ssh key path and ssh params to local ssh config file' ));
            return execProvider.exec(`echo '${config}' >> ${localConfigPath}`)
        }).then(std => {
            console.log(chalk.green( 'ssh config is' ));
            return execProvider.exec(`cat ${localConfigPath}`)
        }).then(std => {
            console.log(chalk.green( 'create ~/.ssh/config is not exist and change permission to 600' ));
            return execProvider.exec(sshConfigFileCmds)
        }).then(std => {
            console.log(chalk.green( 'include local config path in ~/.ssh/config' ));
            return execProvider.exec(sshIncludeCmd)
        });
    }

    delete(vmName){
        let stopVm = "vm stop " + vmName;
        let deleteVM = "vm rm " + vmName;
        return execProvider.exec(stopVm).then(_ =>{
            return execProvider.exec(deleteVM)
        })   
    }

    ssh(cmd, sshCmd, params=new Map()){
        return sshExec(cmd, sshCmd, params);
    }

    async run(vmName, image="ubuntu:focal", memory="5") {
        let cmd = `vm run -m ${memory} ${vmName} ${image}`;
        return execProvider.exec(cmd).then(std => {
            return this.sshConfig(vmName);
        });
    }

    exec(cmd){
        return execProvider.exec(cmd);
    }

    scp(src, dest, inventory){
        scpSync(src, dest, inventory);
    }
}

module.exports = new VMProvider();
