# Pipeline Project - DevOps-17

## Instructions to Run the Project
- clone the repo `git clone https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-17.git`
- change the directory `cd DEVOPS-17`
- run `npm install` and `npm link`
- use env template to create .env `cp env.template .env`
- update the values for MYSQL Password, GitHub Username, GitHub Token.
- for Intel/AMD64 users, checking if you have at least `4G memory` for the virtual machine.
- initiate the pipeline `pipeline init` or `node index.js init`
- build the pipeline `pipeline build <job-name> <path to build.yml>` or `node index.js build <job-name> <path to build.yml>`

** VM name is set as `M1`

** New User created for MySQL is `admin`

** [job-name] for running iTrust2 is itrust-build

** VM information is stored at DEVOPS-17/config.txt after `init` is run

## Description for `.env` file
In the .env file, we need to set up the following variables to run the building jobs:
```
MYSQL_PSSW='' 
GIT_USER=''
TOKEN=''
```
- MYSQL_PSSW: the password of the 'admin' user for mysql
- GIT_USER: a git account that can access the project on https://github.ncsu.edu/.
- TOKEN: the token created by your git account

## Process Involved in Setting Up the Pipeline
- Used the learning from class and homework assignments on:
  - child_process.exec to execute shell commands.
  - start VM using `bakerx` and `basicvm`.
- extract ip, user, ssh key path of the VM using:
  - `bakerx ssh-info <VM-NAME>`
  - `vm ssh-config <VM-NAME>`
- loading .env in node.js
- defining steps in build.yml for installations and configurations:
  - installing java, mysql, maven, git.
  - setting password for mysql only when not already set
  - synchronize the system time of VM with time servers: to avoid broken packages during installations.
- understanding the functionality of iTrust2
- using github token to clone the private repo
- `sed` and `awk` commands to replace keywords in a file
- using .ssh/config file to ssh with a hostname
  - eg: `ssh M1` where config file is:
  ```shell
  Host M1
      HostName 192.168.xx.xxx
      User ubuntu
      IdentityFile <path to ssh key>
      StrictHostKeyChecking no
      UserKnownHostsFile /dev/null
  ```
- executing shell cmd on VM remotely from local machine by prepending the ssh cmd.

## Machines that Developers have tested on:
- macOS Monterey with a M1 processor
- macOS Big Sur with an Intel processor

## Issues Encountered during the Process of Automation
- Encountered broken package during installation occasionally due to system time drift. 
  - **Solution**: used `sudo systemctl restart systemd-timesyncd.service` to explicitly sync the system time.
- MySQL password set command failed on building the pipeline multiple times.
  - **Solution**: used a new user for which the password can be changed as number of times as required.
- The new MySQL user created for iTrust2 doesn't have privileges to manipulate MySQL.
  - **Solution**: granted the new user with all privileges to the MySQL.
- Default buffer size of child_process is 200KB whereas output `mvn test` command was almost 1.9 MB. So, entire stdout could not be displayed.
  - **Solution**: explicitly updated the max buffer size of child_process to 2 MB. 

## Demo Screencast
### Screencast for Intel
[![Intel Demo](./static/Intel_demo.png)](https://drive.google.com/file/d/1RGOJzXG19odPBtmXrGc9IQB3BXlwUIaD/view?usp=sharing "Intel Demo")<br/>
### Screencast for M1
[![Screencast for M1](./static/M1_Screencasts_Thumbnail.png)](https://youtu.be/35rETvH5RFE)

## [Checkpoint Report](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-17/blob/main/CHECKPOINT-M1.md)
This checkpoint report includes the tasks we have completed along with the team contributions, the issues we have faced while implementing or completing tasks, and what work remains after this checkpoint. There will also be a screenshot of the Github Project at the time this Checkpoint document was created.
