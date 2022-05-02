require('dotenv').config()
const chalk = require('chalk');
const axios = require("axios");
const fs = require('fs');
const path = require('path');
const vmProvider = require("../lib/vmProvider");
const bakerxProvider = require("../lib/bakerxProvider");
const execProvider = require('../lib/exec/ExecProvider');
const { env } = require('process');
const droplet = require("../lib/droplet")
const { serverNames } = require("../lib/blueGreenStrategy")

exports.command = 'prod up';
exports.desc = 'Create a production on the DigitalOcean';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;

    console.log("Check if the TOKEN exists")

    let provider = null;
    if (processor == "Intel/Amd64") {
        provider = bakerxProvider
    } else {
        provider = vmProvider
    }

	var region = "nyc1"; // Fill one in from #1
	var image = "ubuntu-20-04-x64"; // Fill one in from #2
    let sshKeys = await droplet.listSshKeys();

    if(sshKeys.length == 0){
        console.log(chalk.red("You should upload a ssh key to your digital account"))
        return
    }

    // reset the server by delete existing one and create a new one
    let flag = false;
	for(let server in serverNames) {
		await droplet.cleanExistDroplet(server);
		let hostInfo = `HOST ${server}`;
		await droplet.writeToInventory(hostInfo, flag);
		await droplet.createDroplet(server, region, image, sshKeys[0]);
        flag = true;
	}
    
    async function cleanExistDroplet(headers, serverName){
		console.log( chalk.yellow (`***** CLEANING EXISTING DROPLET WITH NAME: ${serverName} *****`) );
        let response = await axios.get("https://api.digitalocean.com/v2/droplets", {headers:headers}).catch( err => 
			console.error(chalk.red(`fail to list droplet : ${err}`)) 
		);
        if(response.data && response.data.droplets){
            let targets = response.data.droplets.filter(droplet=>{
                return droplet.name == serverName;
            });
            for(let i in targets){
                await deleteDroplet(targets[i].id, headers);
            }
        }
		// Adding Host IP address
		fs.writeFile('../inventory.txt', "HOST=`127.0.0.1`" + "\n" + "PORT=`2005`" + "\n", (err) => {
          
            // In case of a error throw err.
            if (err) throw err;
        })
    }

    async function deleteDroplet(id, headers)
	{
		if( typeof id != 'number' )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		// HINT, use the DELETE verb.
		let response = await axios.delete('https://api.digitalocean.com/v2/droplets/'+id, { headers: headers })
				.catch(err => console.error(`dropletInfo ${err}`));
        console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		if( !response ) return;

		// No response body will be sent back, but the response code will indicate success.
		// Specifically, the response code will be a 204, which means that the action was successful with no returned body data.
		if(response.status == 204)
		{
			console.log( chalk.green (`Deleted droplet ${id}`) );
		}

	}

    async function listSshKeys(headers){
		console.log( chalk.yellow ('***** LIST SSH KEYS *****') );
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/account/keys', { headers: headers })
							 .catch(err => console.error(`listSshKeys ${err}`));
		if( !response ) return '';
		console.log(response.data);

        let sshIds = []

		response.data.ssh_keys.forEach(element => {
            sshIds.push(element.id);
		});
		console.log("sshs: " + sshIds);
        fs.appendFile('../inventory.txt', "sshIds: " + sshIds + "\n", (err) => {
          
            // In case of a error throw err.
            if (err) throw err;
        })
        return sshIds;
	}


    async function createDroplet (dropletName, region, imageName, sshKey, headers )
	{
		console.log( chalk.yellow('***** CREATE DROPLET *****') );
		if( dropletName == "" || region == "" || imageName == "" )
		{
			console.log( chalk.red("You must provide non-empty parameters for createDroplet!") );
			return;
		}

		var data = 
		{
			"name": dropletName,
			"region":region,
			"size":"s-1vcpu-1gb",
			"image":imageName,
			"ssh_keys": sshKey,
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		console.log("Attempting to create: "+ JSON.stringify(data) );

		let response = await axios.post("https://api.digitalocean.com/v2/droplets", 
		data,
		{
			headers:headers,
		}).catch( err => 
			console.error(chalk.red(`createDroplet: ${err}`)) 
		);
		console.log(response.status);
		console.log(response.data);

		if(response.status == 202)
		{
            dropletId = response.data.droplet.id;
            var inventory = `\tdropletID ${dropletId}`;
            await writeToInventory(inventory);

            fs.appendFile('../inventory.txt', inventory, (err) => {
          
                // In case of a error throw err.
                if (err) throw err;
            })
			console.log(chalk.green(`Created droplet id ${response.data.droplet.id}`));
		}
		await new Promise(r => setTimeout(r, 10000));

		if( typeof dropletId != "number" )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}
		await dropletInfo(dropletId);
	}


	async function dropletInfo(dropletId) 
	{
		// Make REST request
		console.log( chalk.yellow (`***** Fetching Details for droplet: ${dropletId} *****`) )
		response = await axios.get('https://api.digitalocean.com/v2/droplets/'+dropletId, { headers: headers })
				.catch(err => console.error(`dropletInfo ${err}`));
		if( !response ) return;
		console.log(response.status);
		console.log(response.data);

		if( response.data.droplet )
		{
			let droplet = response.data.droplet;
			
			// Print out IP address
			droplet.networks.v4.forEach(ele =>{
				if (ele.type == "public") {
					let ini = `\tHOSTIP ${ele.ip_address}\n\tUSER root`;
					writeToInventory(ini);
				}
			})
            console.log(`Inventory Saved to: inventory.txt`);
		}
	}


	async function writeToInventory(content, append=true) {
		let inventoryFile = "inventory.txt";
		if(append) {
			execProvider.exec(`echo '${content}' >> ${inventoryFile}`)
			// fs.appendFile(inventoryFile, `\n${content}`, (err) => {          
			// 	if (err) throw err;
			// })
		} else {
			execProvider.exec(`echo '${content}' > ${inventoryFile}`)
			// fs.writeFile(inventoryFile, `\n${content}`, (err) => {          
			// 	if (err) throw err;
			// })
		}
	};
};
