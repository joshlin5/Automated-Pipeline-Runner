const chalk = require('chalk');
const child = require('child_process');

class ExecProvider {
    exec(cmd) {
        console.log( chalk.yellowBright(`Running ${cmd}` ));
        return new Promise( (resolve, reject) => {

            let subprocess = child.exec(cmd);

            // Subscribe to stdout, stderr events
            subprocess.stdout.on('data', stdout => {
                console.log( chalk.gray(stdout.toString() ));
                resolve(stdout.toString())
            });
            subprocess.stderr.on('data', stderr => {
                console.log( chalk.gray(stderr.toString() ));
                resolve(stderr.toString())
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

module.exports = new ExecProvider();