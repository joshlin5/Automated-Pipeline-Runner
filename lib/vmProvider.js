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

    async delete(vmName){
        let stopVm = "vm stop " + vmName;
        let deleteVM = "vm rm " + vmName;
        return this._exec(stopVm).then(_ =>{
            return this._exec(deleteVM)
        })
        
    }

    async run(vmName="M1", image="ubuntu:focal") {
        let cmd = `vm run ${vmName} ${image}`;
        return this._exec(cmd, false).then(std =>{
            // the following steps is for creating ssh key
            return this._exec(`ssh-keygen -t rsa -b 4096 -C "config-srv" -f config-srv -N ""`)
        }).then(std=>{
            return this._exec(`cat config-srv.pub >> .ssh/authorized_keys`)
        }).then(std=>{
            return this._exec(`cp config-srv /bakerx/.ssh`)
        });
    }

    // get the host ip of vm to create ssh command
    async getHost(){
        return this._exec("vm list").then(str =>{
            let regex = /M1.*('.*')/gm;
            let match = regex.exec(str);
            return match[1]
        })
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
                resolve(stdout.toString())             
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
