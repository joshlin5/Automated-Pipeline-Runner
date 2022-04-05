require('dotenv').config()
const chalk = require('chalk');
const bakerxProvider = require('../lib/bakerxProvider');
const vmProvider = require("../lib/vmProvider");


exports.command = 'init';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;
    const vm_name = 'M2';
    console.log(chalk.green("Preparing computing environment..."));
    let provider = processor == "Arm64" ? vmProvider : bakerxProvider;
    await provider.delete(vm_name);
    await provider.run();
};
