require('dotenv').config()
const chalk = require('chalk');
const axios = require("axios");
const fs = require('fs');
const { env } = require('process');
const execProvider = require('./exec/ExecProvider');

class Droplets {

    constructor() {
        let token = env["PROVISION_TOKEN"] || '';
        if (token == ''){
            console.log(chalk.red("Fail to create the production because there is no PROVISION_TOKEN in .env"))
            return
        }
        this.headers ={
            'Content-Type':'application/json',
            Authorization: 'Bearer ' + token
        };
    }
       
    async cleanExistDroplet(serverName){
		console.log( chalk.yellow (`***** CLEANING EXISTING DROPLET WITH NAME: ${serverName} *****`) );
        let response = await axios.get("https://api.digitalocean.com/v2/droplets", {headers:this.headers}).catch( err => 
			console.error(chalk.red(`fail to list droplet : ${err}`)) 
		);
        if(response.data && response.data.droplets){
            let targets = response.data.droplets.filter(droplet=>{
                return droplet.name == serverName;
            });
            for(let i in targets){
                await this.deleteDroplet(targets[i].id);
            }
        }
    }

    async deleteDroplet(id)
	{
		if( typeof id != 'number' )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		// HINT, use the DELETE verb.
		let response = await axios.delete('https://api.digitalocean.com/v2/droplets/'+id, { headers: this.headers })
				.catch(err => console.error(`dropletInfo ${err}`));
		if( !response ) return;

		// No response body will be sent back, but the response code will indicate success.
		// Specifically, the response code will be a 204, which means that the action was successful with no returned body data.
		if(response.status == 204)
		{
			console.log( chalk.green (`Deleted droplet ${id}`) );
		}

	}

    async listSshKeys(){
		console.log( chalk.yellow ('***** LIST SSH KEYS *****') );
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/account/keys', { headers: this.headers })
							 .catch(err => console.error(`listSshKeys ${err}`));
		if( !response ) return '';
		console.log(response.data);

        let sshIds = []

		response.data.ssh_keys.forEach(element => {
            sshIds.push(element.id);
		});
		console.log("sshs: " + sshIds);
        return sshIds;
	}


    async createDroplet (dropletName, region, imageName, sshKey)
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

		let response = await axios.post("https://api.digitalocean.com/v2/droplets", data, { headers: this.headers }).catch( err => 
			console.error(chalk.red(`createDroplet: ${err}`))
		);
		if( !response ) return

		console.log(response.status);
		console.log(response.data);

		if(response.status == 202)
		{
            let dropletId = response.data.droplet.id;
            var inventory = `\tdropletID ${dropletId}`;
            await this.writeToInventory(inventory);

			console.log(chalk.green(`Created droplet id ${response.data.droplet.id}`));

			if( typeof dropletId != "number" )
			{
				console.log( chalk.red("You must provide an integer id for your droplet!") );
				return;
			}
			await new Promise(r => setTimeout(r, 10000));
			await this.dropletInfo(dropletId);
		}
	}


	async dropletInfo(dropletId) 
	{
		// Make REST request
		console.log( chalk.yellow (`***** Fetching Details for droplet: ${dropletId} *****`) )
		let response = await axios.get('https://api.digitalocean.com/v2/droplets/'+dropletId, { headers: this.headers })
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
					this.writeToInventory(ini);
				}
			})
            console.log(`Inventory Saved to: inventory.txt`);
		}
	}

	async writeToInventory(content, append=true) {
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

module.exports = new Droplets();