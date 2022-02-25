#!/usr/bin/env node
const yargs = require('yargs');
const { check } = require('./lib/dep');

(async () => {

    yargs
        .middleware(check)
        .commandDir('./commands')
        .version()
        .demandCommand(1, 'Did you forget to specify a command?')
        .recommendCommands()
        .showHelpOnFail(true, 'Specify --help for available options')
        .strict(true)
        .help()
        .wrap(yargs.terminalWidth())
        .argv
})();