# PROJECT CHECKPOINT - PIPELINE BUILD

## TASKS BREAKDOWN
| Task | Contibution| Issue Encountered | Resolution |
| --- | --- | --- | --- |
| Discussion on Tasks Breakdown and directory structure of Repo | @chung4 @jlin36 @vyadav | No Issues |  |
| Tasks and Issues creation under `TASK SCHEDULE` Project | @chung4 @jlin36 @vyadav | No Issues |  |
| Automating Pipeline init for Intel Processor  | @chung4 | <li>how to move ssh key to the host and use it for setup part in build.yml</li><li>install mysql and config it password</li><li>combine the Intel part with ARM64</li> | <li>add `--sync` parameter in bakerx.yml</li> |
| Automating Pipeline init for Arm64 Processor  | @vyadav | <li>finding basicvm using hasbin library</li><li>fetching IP of running VM</li> | <li>replace bin name from `basicvm` to `vm`</li><li>use `vm ssh-config <vm name>`</li> |


## TASKS PENDING
- Automating Pipeline build for Intel Processor
- Automating Pipeline build for Arm64 Processor
- Create a build.yml file for iTrust2-v10



## GitHub Project Screenshot
![GitHub Project Screenshot](/resources/Checkpoint%20Github%20Project%20Screenshot.png)
