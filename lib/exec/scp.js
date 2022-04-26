const path = require('path');
const os   = require('os');

const child = require('child_process');
module.exports = function(src, dest, inventory) {
    const {PORT, IDENTIFY_FILE, HOST, USER} = inventory;
    dest = `${USER}@${HOST}:${dest}`;
    let scpArgs = [];
    scpArgs.push(`-q`);
    scpArgs.push(`-P`);
    scpArgs.push(`${PORT}`);
    scpArgs.push(`-i`);
    scpArgs.push(`"${IDENTIFY_FILE}"`)
    scpArgs.push(`-o`);
    scpArgs.push(`StrictHostKeyChecking=no`);
    scpArgs.push(`-o`);
    scpArgs.push(`UserKnownHostsFile=/dev/null`);
    scpArgs.push(`"${src}"`);
    scpArgs.push(`"${dest}"`);        
    // console.log(scpArgs);
    return child.spawnSync(`scp`, scpArgs, {stdio: 'inherit', shell: true});
}