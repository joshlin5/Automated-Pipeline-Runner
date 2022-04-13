
const esprima = require("esprima");
const puppeteer = require('puppeteer');
const escodegen = require("escodegen");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');
const execProvider = require('./execProvider');
const { throws } = require("assert");
// add cloneR when finished
let operations = [ NegateConditionals, conditionalBoundary, incremental, 
    controlFlow, conditionalExpression, nonEmptyString, constantReplacement ]
let targetUrls =[
    'http://localhost:3000/survey/long.md',
    'http://localhost:3000/survey/upload.md',
    'http://localhost:3000/survey/survey.md',
    'http://localhost:3000/survey/variations.md'
]
let regex = /http:\/\/localhost:3000\/survey\/(.*)\.md/
let microserviceDir = '~/checkbox.io-micro-preview/'
exports.command = 'testharness <jsFile>';
exports.desc = '';
exports.builder = yargs => {
    yargs.options({
    });
};
exports.handler = async argv => {
    const { jsFile, processor } = argv;
    console.log(jsFile)
    let fileRegex = /(.*)\.js$/
    let fileName = fileRegex.exec(jsFile)[1];
    // save the origin file for mutation
    fs.copyFileSync(jsFile, `${fileName}_ori.js`)
    // record the origin file name for recovery
    let oriFile = fileName+'_ori.js';

    await execProvider.exec(`cd ${microserviceDir} && pm2 start index.js`);

    for(let i =0; i< 1 ;i++){
        for(let j in targetUrls){
            let url = targetUrls[j];
            let picFileName = `${regex.exec(url)[1]}-${i}`;
            rewrite(oriFile, jsFile)
            await execProvider.exec("pm2 reload index");
            await checkServerReady(url);
            await screenshot(url, picFileName);
        }
    }

    // recovery the file
    fs.copyFileSync(oriFile, `${fileName}.js`)
    await execProvider.exec("pm2 kill")
}


function rewrite( filepath, newPath ) {
    console.log(filepath, newPath)
    var buf = fs.readFileSync(filepath, "utf8");
    var ast = esprima.parse(buf, options);    

    let op = operations[getRandomInt(7)];
    
    op(ast);

    let code = escodegen.generate(ast);
    fs.writeFileSync( newPath, code);
}

async function checkServerReady(url){
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    let cnt = 0;
    while(true){
        try{
            cnt++;
            await page.goto(url, {
                waitUntil: 'networkidle0'
            });
            break;
        }catch(error){
            if(cnt>1000){
                throw error;
            }
            await delay(500);
        }
    }
    await page.close();
    await browser.close();

}

async function screenshot(url, filename){
    const fn = `./${filename}.png`;
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: 'networkidle0'
    });
    await page.screenshot({
        path: fn,
        fullPage: true
    });
    await page.close();
    await browser.close();
}


function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}



function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}

// Helper function for counting children of node.
function childrenLength(node)
{
	var key, child;
	var count = 0;
	for (key in node) 
	{
		if (node.hasOwnProperty(key)) 
		{
			child = node[key];
			if (typeof child === 'object' && child !== null && key != 'parent') 
			{
				count++;
			}
		}
	}	
	return count;
}


// Helper function for checking if a node is a "decision type node"
function isDecision(node)
{
	if( node.type == 'IfStatement' || node.type == 'ForStatement' || node.type == 'WhileStatement' ||
		 node.type == 'ForInStatement' || node.type == 'DoWhileStatement')
	{
		return true;
	}
	return false;
}

// Helper function for printing out function name.
function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "anon function @" + node.loc.start.line;
}

// TODO 1: Conditional boundary mutations: > => >=, < => <=
function conditionalBoundary(ast)
{
	let candidates = 0
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && (node.operator === ">" || node.operator === "<")) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" ) {
            if(node.operator === ">" && current === mutateTarget){
                node.operator = ">="
                console.log( chalk.red(`Replacing > with >= on line ${node.loc.start.line}` ));
            }
            if(node.operator === "<" && current === mutateTarget){
                node.operator = "<="
                console.log( chalk.red(`Replacing < with <= on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })
}
// TODO 2: Incremental mutations: ++j => j++, i++ => i--
function incremental(ast)
{
	let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "UpdateExpression") {
            candidates++;
        }
    })
    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "UpdateExpression") {
            if(current == mutateTarget){
                node.prefix = !node.prefix;
                console.log( chalk.red(`Replacing i${node.operator} with ${node.operator}i on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })
}
// TODO 3: Negate conditionals: == => !=, > => <
function NegateConditionals(ast) {

    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && (node.operator === ">" || node.operator === "==")) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && (node.operator === ">" || node.operator === "==")) {
            if( current === mutateTarget ) {
                ori = node.operator;
                node.operator = node.operator === ">" ? "<" : "!=";
                console.log( chalk.red(`Replacing ${ori} with ${node.operator} on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })

}
// TODO 4: Mutate control flow if => else if
function controlFlow(ast)
{
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "IfStatement") {
            candidates++;
        }
    })
    
    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    let previous;
    traverseWithParents(ast, (node) => {
        if( node.type === "IfStatement") {
            if( current == mutateTarget) {
                console.log( chalk.red(`convert if on line ${node.loc.start.line} to else if and relocated at line ${previous.loc.start.line}` ));
                previous.alternate = node;

            }else if(current == (mutateTarget-1)){
                previous = node;
            }
            current++;
        }
    })
}
// TODO 5: Conditional expression mutation && => ||, || => &&
function conditionalExpression(ast)
{
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "LogicalExpression" && (node.operator === "&&" || node.operator === "||") ) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
	traverseWithParents(ast, (node) => {
        if( node.type === "LogicalExpression") {
            if (node.operator === "&&") {
                if( current === mutateTarget ) {
                    node.operator === "||";
                    console.log( chalk.red(`Replacing && with || on line ${node.loc.start.line}` ));
                }
            }
            else if (node.operator === "||") {
                if( current === mutateTarget ) {
                    node.operator === "&&";
                    console.log( chalk.red(`Replacing || with && on line ${node.loc.start.line}` ));
                }
            }
        }
    })
}
// TODO 6: Clone return, early Find: "return embeddedHtml";, copy and insert in random location of function (before declaration).
function cloneR(ast)
{
	traverseWithParents(ast, (node) => {
        if( node.type === "ReturnStatement" && node.name === "embeddedHtml") {
            
        }
    })
}
// TODO 7: Non-empty string: "" => "<div>Bug</div>".
function nonEmptyString(ast)
{
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.raw === "" ) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
	traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.raw === "") {
            if( current === mutateTarget ) {
                node.raw === "<div>Bug</div>";
                console.log( chalk.red(`Replacing "" with "<div>Bug</div>" on line ${node.loc.start.line}` ));
            }
        }
    })
}

// TODO 8: Constant Replacement: 0 => 3
function constantReplacement(ast)
{
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === "0" ) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
	traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === "0") {
            if( current === mutateTarget ) {
                node.value === "3";
                console.log( chalk.red(`Replacing 0 with 3 on line ${node.loc.start.line}` ));
            }
        }
    })
}