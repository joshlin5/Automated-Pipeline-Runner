const chalk = require('chalk');
const child = require('child_process');
const fs = require('fs');
const path = require('path');
const sshExec = require('./exec/ssh')
const execProvider = require('./exec/ExecProvider');

class VMProvider {

    sshConfig(vmName) {
        let localConfigPath = path.join(path.dirname(require.main.filename), "config.txt")
        let sshConfigPath = '~/.ssh/config'
        let includeLine = `Include ${localConfigPath}`
        let getIpCmd = `vm ssh-config ${vmName}`;
        let sshConfigFileCmds = `touch ~/.ssh/config;chmod 600 ~/.ssh/config`
        let sshIncludeCmd = `grep -qxF '${includeLine}' ${sshConfigPath} || echo "${includeLine}\n$(cat ${sshConfigPath})" > ${sshConfigPath}`
        
        return execProvider.exec(getIpCmd, true).then(std => {
            let config = std.trim() + '\n\tIdentityFile "~/Library/Application\ Support/basicvm/key"' + 
            '\n\tStrictHostKeyChecking no\n\tUserKnownHostsFile /dev/null' 
            return execProvider.exec(`echo '${config}' > ${localConfigPath}`)
        }).then(std => {
            return execProvider.exec(sshConfigFileCmds)
        }).then(std => {
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

    async run(vmName="M1", image="ubuntu:focal") {
        let cmd = `vm run ${vmName} ${image}`;
        return execProvider.exec(cmd).then(std => {
            return this.sshConfig(vmName);
        });
    }

    // get the host ip of vm to create ssh command
    // async getHost(){
    //     return this._exec("vm list").then(str =>{
    //         let regex = /M1.*('.*')/gm;
    //         let match = regex.exec(str);
    //         return match[1]
    //     })
    // }
}

module.exports = new VMProvider();
