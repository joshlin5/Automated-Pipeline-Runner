
const esprima = require("esprima");
const escodegen = require("escodegen");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');
const { throws } = require("assert");
// add cloneR when finished
let operations = [ NegateConditionals, conditionalBoundary, incremental, controlFlow,
    cloneR, conditionalExpression, nonEmptyString, constantReplacement ]

exports.command = 'mutate <jsFile> <newFileName>';
exports.desc = '';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const { jsFile, newFileName, processor } = argv;
    rewrite(jsFile, newFileName)
    
}


function rewrite( filepath, newPath ) {
    var buf = fs.readFileSync(filepath, "utf8");
    var ast = esprima.parse(buf, options);    

    // Randomly picks a mutation to apply
    let op = operations[getRandomInt(operations.length)];
    console.log( chalk.red(`Operating mutation ${op.name}` ));
    op(ast);

    let code = escodegen.generate(ast);
    fs.writeFileSync( newPath, code);
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
        if( node.type === "BinaryExpression" && (node.operator == ">" || node.operator == "==")) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && (node.operator == ">" || node.operator == "==")) {
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
    let tmp = [];
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "IfStatement") {
            candidates++;
            tmp.push(node);
        }
    })
    
    let mutateTarget = getRandomInt(candidates);
    let current = tmp[mutateTarget];
    let previous = tmp[mutateTarget-1];
    console.log( chalk.red(`convert if on line ${current.loc.start.line} to else if and relocated at line ${previous.loc.start.line}` ));
    previous.alternate = current;
    let parent = current.parent;
    // remove the if statement from origin location
    for( var i = 0; i < parent.length; i++){ 
        if ( parent[i].loc.start.line == current.loc.start.line) { 
            parent.splice(i, 1); 
            break;
        }
    }
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
        if( node.type === "LogicalExpression" ) {
            if (node.operator === "&&" && current === mutateTarget) {
                node.operator = "||";
                console.log( chalk.red(`Replacing && with || on line ${node.loc.start.line}` ));
            }
            else if (node.operator === "||" && current === mutateTarget) {
                node.operator = "&&";
                console.log( chalk.red(`Replacing || with && on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })
}
// TODO 6: Clone return, early Find: "return embeddedHtml";, copy and insert in random location of function (before declaration).
function cloneR(ast)
{
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "ReturnStatement") {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
	traverseWithParents(ast, (node) => {
        if( node.type === "ReturnStatement") {
            if( current === mutateTarget ) {
                let parent = node.parent;
                let nIdx = 0;
                // find the target return location
                for( var i = 0; i < parent.length; i++){ 
                    if ( parent[i].loc.start.line == node.loc.start.line) { 
                        nIdx = i;
                        break;
                    }
                }
                let swap = nIdx != 0 ? getRandomInt(nIdx-1) : nIdx;
                console.log( chalk.red(`Moving return embeddedHtml from line ${node.loc.start.line} to line ${parent[swap].loc.start.line}` ));
                let tmp = parent[swap];
                parent[swap] = node;
                parent[nIdx] = tmp;
            }
            current++;
        }
    })
}
// TODO 7: Non-empty string: "" => "<div>Bug</div>".
function nonEmptyString(ast)
{
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === "" ) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
	traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === "") {
            if( current === mutateTarget ) {
                node.raw = "<div>Bug</div>";
                node.value = "<div>Bug</div>";
                console.log( chalk.red(`Replacing "" with "<div>Bug</div>" on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })
}

// TODO 8: Constant Replacement: 0 => 3
function constantReplacement(ast)
{
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && typeof node.value === 'number') {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
	traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && typeof node.value === 'number') {
            if( current === mutateTarget ) {
                let ori = node.value;
                let ranReplacement = getRandomInt(10);
                while(ranReplacement == ori){
                    ranReplacement = getRandomInt(10);
                }
                node.value = ranReplacement;
                node.raw = ranReplacement;
                console.log( chalk.red(`Replacing ${ori} with ${ranReplacement} on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })
}
