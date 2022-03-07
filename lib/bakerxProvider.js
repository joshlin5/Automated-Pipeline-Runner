const chalk = require('chalk');
const execProvider = require('./exec/ExecProvider');
const sshExec = require('./exec/ssh')

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

    ssh(cmd, config, params=new Map()){
        return sshExec(cmd, config, params);
    }

    exec(cmd){
        return execProvider.exec(cmd);
    }
}

module.exports = new BakerxProvider();
