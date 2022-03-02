const chalk = require('chalk');
const child = require('child_process');
const fs = require('fs');
const path = require('path');
const execProvider = require('./exec/ExecProvider');

class BakerxProvider {
    run(){
        return execProvider.exec("bakerx run");
    }

    delete(vmName){
        let listVM = "vboxmanage list vms";
        return execProvider.exec(listVM).then(result =>{
            // check if the name "M1" is used by any VM
            if(result.includes(vmName)){
                console.log(chalk.green("Name 'M1' is used, remove the virtual machine..."));
                return execProvider.exec("bakerx delete vm M1");
            }
        })
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

module.exports = new BakerxProvider();
