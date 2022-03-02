const exec = require('child_process').exec;
const vmProvider = require("./vmProvider");

class Builder {

    // Build and tag Dockerfile 
    async initializeVirtualMachine(vmName, image) {
        await vmProvider.run(vmName, image);
        let config = await vmProvider.sshConfig(vmName);
    }
}



module.exports = new Builder();
