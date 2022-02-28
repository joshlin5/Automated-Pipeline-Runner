const chalk = require('chalk');
const fs   = require('fs');
const path = require('path');
const sshExec = require('../lib/exec/ssh')
const yaml = require('js-yaml');
const buildFile = path.join( path.dirname(require.main.filename), 'build.yml')
const doc = yaml.load(fs.readFileSync(buildFile, 'utf8'));
const sshConfig = {
    host: '127.0.0.1',
    port: 2005,
    user: 'vagrant',
    identifyFile: path.join( path.dirname(require.main.filename), '.ssh', 'config-srv')
};

exports.command = 'build';
exports.desc = 'Trigger a build job, running steps outlined by build.yml, wait for output, and print build log.';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;
    console.log(chalk.green("triggering a build job"));
    // console.log(doc.jobs[0].steps);
    sshExec('ls', sshConfig);
};