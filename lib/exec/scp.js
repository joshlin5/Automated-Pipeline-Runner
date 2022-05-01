const path = require('path');
const os   = require('os');
const { env } = require('process');

const child = require('child_process');
module.exports = function(src, dest, inventory) {
    const {HOSTIP, USER} = inventory;
    dest = `${USER}@${HOSTIP}:${dest}`;
    let scpArgs = [];
    scpArgs.push(`-q`);
    scpArgs.push(`-i`);
    scpArgs.push(`"${env["PROVISION_PRIVATE_PATH"]}"`)
    scpArgs.push(`-o`);
    scpArgs.push(`StrictHostKeyChecking=no`);
    scpArgs.push(`-o`);
    scpArgs.push(`UserKnownHostsFile=/dev/null`);
    scpArgs.push(`"${src}"`);
    scpArgs.push(`"${dest}"`);        
    return child.spawnSync(`scp`, scpArgs, {stdio: 'inherit', shell: true});
}