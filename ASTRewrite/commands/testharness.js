
const resemble = require("resemblejs");
const fs = require("fs");

exports.command = 'testharness <file1> <file2>';
exports.desc = '';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const { file1, file2, processor } = argv;

    resemble(file1).compareTo(file2).onComplete( function(comparisonData) {
        if (comparisonData.misMatchPercentage >= 0) {
            console.log(file2.split("/").pop(), comparisonData.misMatchPercentage);
            throw `Mismatch Percentage is: ${comparisonData.misMatchPercentage}`
        };
    });       
}