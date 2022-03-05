const chalk = require('chalk');
const child = require('child_process');
const fs = require('fs');
const path = require('path');

class VMProvider {



    async sshConfig(vmName) {

        let cmd = `vm ssh-config ${vmName}`;
        this._exec(cmd, true)
        return
    }

    delete(vmName){
        let stopVm = "vm stop " + vmName;
        let deleteVM = "vm rm " + vmName;
        return this._exec(stopVm).then(_ =>{
            return this._exec(deleteVM)
        })
        
    }

    run(vmName="M1", image="ubuntu:focal") {
        let cmd = `vm run ${vmName} ${image}`;
        return this._exec(cmd, false);
    }

    ssh(cmd, config, params=new Map()){
        if(params instanceof Map){
            for (let [key, value] of params) {
                cmd = cmd.replace(key, value);
            }
        }
        let ssh = `vm ssh M1`+ cmd;
        return this._exec(ssh, false)
    }

    exec(cmd){
        return this._exec(cmd, false);
    }


    _exec(cmd, write) {
        console.log( chalk.yellowBright(`Running ${cmd}` ));
        return new Promise( (resolve, reject) => {

            let subprocess = child.exec(cmd);

            // Subscribe to stdout, stderr events
            subprocess.stdout.on('data', stdout => {
                var config = stdout.toString()
                if (write) {
                    config = config.trim() + "\n\tIdentityFile ~/Library/Application\ Support/basicvm/key"
                    fs.writeFile(path.join(path.dirname(require.main.filename), "ssh-config.txt"), config, err => {
                        if (err) {
                            console.error( chalk.red(err) );
                            return
                        }
                        });
                }
                console.log( chalk.gray( config ));                
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
