const chalk = require('chalk');
const path = require('path');
const child = require('child_process');
const execProvider = require('./execProvider')

exports.command = 'init';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;
    console.log(chalk.green("Preparing computing environment..."));

    cmd = "bakerx run"
    console.log( chalk.yellowBright(`Running ${cmd}` ));
    execProvider.exec(cmd);
};