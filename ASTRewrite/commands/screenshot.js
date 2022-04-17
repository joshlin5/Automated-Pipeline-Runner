
const puppeteer = require('puppeteer');
const fs = require("fs");
const chalk = require('chalk');
const { throws } = require("assert");

exports.command = 'screenshot <url> <picName>';
exports.desc = '';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const { url, picName, processor } = argv;
    if(await checkServerReady(url)){
        await screenshot(url, picName);
    }
}


// check if pm2 is ready
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
            if(cnt>20){
                await page.close();
                await browser.close();
                console.log('Mutation fail to start server!!!');
                return false;
            }
            await delay(500);
        }
    }
    await page.close();
    await browser.close();
    return true;

}

async function screenshot(url, filename){
    const fn = `${filename}.png`;
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
