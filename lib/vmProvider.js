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
        
        return this._exec(getIpCmd, true).then(std => {
            let config = std.trim() + '\n\tIdentityFile "~/Library/Application\ Support/basicvm/key"'
            return this._exec(`echo '${config}' > ${localConfigPath}`)
        }).then(std => {
            return this._exec(sshConfigFileCmds, false)
        }).then(std => {
            return this._exec(sshIncludeCmd, false)
        });
    }

    delete(vmName){
        let stopVm = "vm stop " + vmName;
        let deleteVM = "vm rm " + vmName;
        return this._exec(stopVm).then(_ =>{
            return this._exec(deleteVM)
        })
        
    }

    ssh(cmd, sshCmd, params=new Map()){
        return sshExec(cmd, sshCmd, params);
    }

    async run(vmName="M1", image="ubuntu:focal") {
        let cmd = `vm run ${vmName} ${image}`;
        return this._exec(cmd, false).then(std => {
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

    exec(cmd){
        return execProvider.exec(cmd);
    }


    _exec(cmd, write) {
        console.log( chalk.yellowBright(`Running ${cmd}` ));
        return new Promise( (resolve, reject) => {

            let subprocess = child.exec(cmd);

            // Subscribe to stdout, stderr events
            subprocess.stdout.on('data', stdout => {
                if (write) {
                    resolve(stdout.toString());
                }
                console.log( chalk.gray( stdout.toString() ));
            });
            subprocess.stderr.on('data', stderr => {
                console.log( chalk.gray(stderr.toString() ));
            });

            // Subscribe to error starting process or process exiting events.
            subprocess.on('error', err => {
                console.log( chalk.red( err.message ) );
                reject(err);
            });
            subprocess.on('exit', code => {
                resolve(code);
            });
        });
    }
}

module.exports = new VMProvider();
