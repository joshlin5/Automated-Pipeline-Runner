
const esprima = require("esprima");
const escodegen = require("escodegen");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');

let operations = [ NegateConditionals ]

function rewrite( filepath, newPath ) {

    var buf = fs.readFileSync(filepath, "utf8");
    var ast = esprima.parse(buf, options);    

    let op = operations[0];
    
    op(ast);

    let code = escodegen.generate(ast);
    fs.writeFileSync( newPath, code);
}

function NegateConditionals(ast) {

    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && node.operator === ">" ) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && node.operator === ">" ) {
            if( current === mutateTarget ) {
                node.operator = "<"
                console.log( chalk.red(`Replacing > with < on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })

}

rewrite("/Users/cjparnin/classes/devops/checkbox.io-micro-preview/marqdown.js", 
"/Users/cjparnin/classes/devops/checkbox.io-micro-preview/marqdown-mod.js")


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
	
}
// TODO 2: Incremental mutations: ++j => j++, i++ => i--
function incremental(ast)
{
	
}
// TODO 3: Negate conditionals: == => !=, > => <
function negate(ast)
{
	
}
// TODO 4: Mutate control flow if => else if
function controlFlow(ast)
{
	
}
// TODO 5: Conditional expression mutation && => ||, || => &&
function conditionalExpression(ast)
{
	traverseWithParents(ast, (node) => {
        if( node.type === "LogicalExpression") {
            if (node.operator === "&&") {
                node.operator === "||";
                console.log( chalk.red(`Replacing && with || on line ${node.loc.start.line}` ));
            }
            else if (node.operator === "||") {
                node.operator === "&&";
                console.log( chalk.red(`Replacing || with && on line ${node.loc.start.line}` ));
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
	traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.raw === "") {
            node.raw === "<div>Bug</div>";
            console.log( chalk.red(`Replacing "" with "<div>Bug</div>" on line ${node.loc.start.line}` ));
        }
    })
}

// TODO 8: Constant Replacement: 0 => 3
function constantReplacement(ast)
{
	traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === "0") {
            node.value === "3";
            console.log( chalk.red(`Replacing 0 with 3 on line ${node.loc.start.line}` ));
        }
    })
}