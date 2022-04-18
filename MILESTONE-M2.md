# Milestone 2 (Pipeline > Mutation Coverage)

## TASKS BREAKDOWN
| Task | Contibution| Issue Encountered | Resolution |
| --- | --- | --- | --- |
| Working on modifications for M1 submission | @vyadav | <li>unavailability of windows environment with root access to test changes</li> |  |
| Generate snapshots | @chung4 @vyadav | <li>Server not starting for few mutations</li><li>page and browser not closing properly</li> | exception handling |
| Implement mutation operations | @chung4 @jlin36 | |  |
| Create test harness to generate snapshot from mutated code  | @chung4 @jlin36 | <li>implementation using internal functional call threw error</li> | <li>created individual commands for screenshot, mutation to enable bash cmd using ssh</li> |
| Compare snapshots using image-based difference  | @vyadav | <li>couldn't compare the screenshots at home directory of vm due to access issues from local to vm</li><li>opted one of the two solutions: instead of creating command for compare screenshots saved the screenshot in shared volume and compared locally</li> |  |
| Generate mutation coverage using test harness | @chung4 @vyadav |  |  |
| Generating output logs and errors  | @chung4 @jlin36 @vyadav |  |  |
| Create a build job specification in build.yml | @chung4 | <li>pick the value of url, snapshots and iterations within build.yml </li> | <li>Automated later by handling from build.js</li> |
| Installation dependencies issue during build job | @vyadav | chromium-browser install and canvas install | eequired the dependencies to be installed separately and they were included in build.yml setup |
| Automating build job specification | @vyadav | node js level challenges with async functions | read about correct way of exceptional handling and to keep function calls synchronous when required |
| Screencast creation | @chung4 @jlin36 | | |
| Execution for 1000 iterations | @vyadav | unexpectedly stop after 100-120 iterations | ensured page and browser get closed properly |

#### Screenshot location:
screenshots folder at root contains all the screenshots for every mutation for almost every urls. 
For the given urls if the image after mutation for any one of them doesn't match the original image, the image/screenshot creation for remaining urls are ignored for that mutation. So, the total number of images(except baseline image) would be <= 4000

### Pre-requisites needed to run Milestone 2:
`js-yaml` is a dependency that is installed automatically. In case `pipeline init` gives an error related to `js-yaml`, please run the following command:
- `npm install js-yaml --save-prod`
 
`fs-extra` module should be present. In case it throws an error, please run the following command:
- `npm install fs-extra`

### Learnings/Experiences in Milestone 2:
- Esprima and escodegen functionalities 
- ASTRewrite ast tree traversal for mutator automation
- build.yml automation to ensure commands helps in extending the project to install any dependency
- snapshot generation 
- resemblejs functionalities
- Synchronous call to Asynchronous functions

### Project Board:
![GitHub Project Board Screenshot](/resources/M2-Project-Board.png)
