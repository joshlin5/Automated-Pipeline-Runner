require('dotenv').config()
const bakerxProvider = require('../lib/bakerxProvider');
const vmProvider = require("../lib/vmProvider");


exports.command = 'init';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const {processor } = argv;
    console.log(chalk.green("Preparing computing environment..."));
    let provider = processor == "Intel/Amd64" ? bakerxProvider : vmProvider;
    await provider.exec('mkdir -p ./.ssh');
    await provider.delete("M1")
    await provider.run();
};
