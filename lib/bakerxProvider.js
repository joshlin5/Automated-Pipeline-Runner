const path = require('path');
const chalk = require('chalk');
const execProvider = require('./exec/ExecProvider');
const sshExec = require('./exec/ssh')

class BakerxProvider {

    sshConfig(vmName) {
        let localConfigPath = path.join(path.dirname(require.main.filename), "config.txt")
        let getIpCmd = `bakerx ssh-info ${vmName}`;
        return execProvider.exec(getIpCmd, true).then(std => {
            this.exec(`echo '${std}' > ${localConfigPath}`)
            return std
        }).then(sshInfo =>{
            let sshConfig = {
                identifyFile: null,
                port: 2005, 
                user: "vagrant",
                host: "127.0.0.1"
            }
            let fileRegx = /-i "(.*)"/;
            sshConfig["identifyFile"] = fileRegx.exec(sshInfo)[1];
            return `ssh -q -i "${sshConfig.identifyFile}" -p ${sshConfig.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${sshConfig.user}@${sshConfig.host}`;
        });
    }

    run(){
        return execProvider.exec("bakerx run");
    }

    delete(vmName){
        let listVM = "vboxmanage list vms";
        return execProvider.exec(listVM, true).then(result =>{
            // check if the name "M1" is used by any VM
            if(result.includes(vmName)){
                console.log(chalk.green("Name 'M1' is used, remove the virtual machine..."));
                return execProvider.exec("bakerx delete vm M1");
            }
        })
    }

    ssh(cmd, sshCmd, params=new Map()){
        return sshExec(cmd, sshCmd, params);
    }

    exec(cmd){
        return execProvider.exec(cmd);
    }
}

module.exports = new BakerxProvider();
