const esprima = require("esprima");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');
const { throws } = require("assert");

exports.command = 'analysis <filePath>';
exports.desc = '';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const { filePath, processor } = argv;
    main(filePath)
    
}

function main(filePathIn)
{
	var filePath = filePathIn;

	console.log( "Parsing ast and running static analysis...");
	var builders = {};
	complexity(filePath, builders);
	console.log( "Complete.");


	// Report
	for( var node in builders )
	{
		var builder = builders[node];
		builder.report();
	}

}



function complexity(filePath, builders)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var ast = esprima.parse(buf, options);

	var i = 0;

	// Initialize builder for file-level information
	var fileBuilder = new FileBuilder();
	fileBuilder.FileName = filePath;
	builders[filePath] = fileBuilder;

	// Traverse program with a function visitor.
	traverseWithParents(ast, function (node) 
	{
		// File level calculations
		// 1. Strings
		if (node.type === "Literal" && typeof node.value === "string") {
			fileBuilder.Strings++;
		}
		// 2. Packages
		if (node.type === "CallExpression" && node.callee.name === "require") {
			fileBuilder.ImportCount++;
		}
		if (node.type === 'FunctionDeclaration') 
		{
			var builder = new FunctionBuilder();

			builder.FunctionName = functionName(node);
			builder.StartLine = node.loc.start.line;
			// Calculate function level properties.
			// 3. Parameters
			builder.ParameterCount = node.params.length
			// 4. Method Length
			builder.Length = node.loc.end.line - builder.StartLine
			// With new visitor(s)...
			// 5. CyclomaticComplexity
			var dict = {};
			var bool = false;
			var identifier_count = 0;
			traverseWithParents(node, function(child) {
				if (isDecision(child)) {
					bool = true;
					// always has at least one boolean predicate
					identifier_count++;
					builder.SimpleCyclomaticComplexity++;
				}
				// Block Statments always indicate the end of a decision type node
				else if (child.type === "BlockStatement") {
					if ((identifier_count) > builder.MaxConditions && identifier_count != 0) {
						builder.MaxConditions = identifier_count;
						identifier_count = 0;
					}
					bool = false;
				}
				// 7. MaxConditions
				if (child.type === "LogicalExpression" && bool) {
					identifier_count++;
				}
			})
			// 6. Halstead
			traverseWithParents(node.body, function(child) {
				if (child.type === "Identifier") {
					if (!(child.name in dict)) {
						dict[child.name] = child.type;
						builder.Halstead++;
					}
				}
				if (child.type === "BinaryExpression") {
					if (!(child.operator in dict)) {
						dict[child.operator] = child.type;
						builder.Halstead++;
					}
				}
			})
			// 8. MaxDepth
			traverseWithParents(node, function(child) {
				if(childrenLength(child) == 0) {
					var temp = child;
					var max_depth = 0;
					while(temp.type !== "FunctionDeclaration") {
						if (isDecision(temp) && !temp.parent.hasOwnProperty("alternate"))
							max_depth++;
						temp = temp.parent;
					}
					if(max_depth > builder.MaxNestingDepth) {
						builder.MaxNestingDepth = max_depth;
						max_depth = 0;
					}
				}
			})
			builders[builder.FunctionName] = builder;
		}

		if( node.type === "ReturnStatement" ) {
			let returnLine = node.loc.start.line;
			// console.log( chalk.red(`Found return at ${returnLine}` ));
			let parentLine = 0;
			let temp = node;
			while(temp.type !== "FunctionDeclaration" ) {
				temp = temp.parent;
			}
			parentLine = temp.loc.start.line;
			// console.log( chalk.red(`Starts at ${parentLine} and end at ${returnLine}` ));
		}
	});

}

// Represent a reusable "class" following the Builder pattern.
class FunctionBuilder
{
	constructor() {
		this.StartLine = 0;
		this.FunctionName = "";
		// The number of parameters for functions
		this.ParameterCount  = 0;
		// The number of lines.
		this.Length = 0;
		// Number of if statements/loops + 1
		this.SimpleCyclomaticComplexity = 1;
		// Number of unique symbols + operators
		this.Halstead = 0;
		// The max depth of scopes (nested ifs, loops, etc)
		this.MaxNestingDepth    = 0;
		// The max number of conditions if one decision statement.
		this.MaxConditions      = 0;
	}

	threshold() {

        const thresholds = {
            SimpleCyclomaticComplexity: [{t: 10, color: 'red'}, {t: 4, color: 'yellow'}],
            Halstead: [{t: 10, color: 'red'}, {t: 3, color: 'yellow'}],
            ParameterCount: [{t: 10, color: 'red'}, {t: 3, color: 'yellow'}],
            Length: [{t: 100, color: 'red'}, {t: 10, color: 'yellow'} ]
        }

        const showScore = (id, value) => {
            let scores = thresholds[id];
            const lowestThreshold = {t: 0, color: 'green'};
            const score = scores.sort( (a,b) => {a.t - b.t}).find(score => score.t <= value) || lowestThreshold;
            return score.color;
        };

        this.Halstead = chalk`{${showScore('Halstead', this.Halstead)} ${this.Halstead}}`;
        this.Length = chalk`{${showScore('Length', this.Length)} ${this.Length}}`;
        this.ParameterCount = chalk`{${showScore('ParameterCount', this.ParameterCount)} ${this.ParameterCount}}`;
        this.SimpleCyclomaticComplexity = chalk`{${showScore('SimpleCyclomaticComplexity', this.SimpleCyclomaticComplexity)} ${this.SimpleCyclomaticComplexity}}`;

	}

	report()
	{
		this.threshold();

		console.log(
chalk`{blue.underline ${this.FunctionName}}(): at line #${this.StartLine}
Parameters: ${this.ParameterCount}\tLength: ${this.Length}
Cyclomatic: ${this.SimpleCyclomaticComplexity}\tHalstead: ${this.Halstead}
MaxDepth: ${this.MaxNestingDepth}\tMaxConditions: ${this.MaxConditions}\n`
);
	}
};

// A builder for storing file level information.
function FileBuilder()
{
	this.FileName = "";
	// Number of strings in a file.
	this.Strings = 0;
	// Number of imports in a file.
	this.ImportCount = 0;

	this.report = function()
	{
		console.log (
			chalk`{magenta.underline ${this.FileName}}
Packages: ${this.ImportCount}
Strings ${this.Strings}
`);

	}
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