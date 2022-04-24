require('dotenv').config()
const chalk = require('chalk');
const axios    = require("axios");
const fs = require('fs');
const path = require('path');
const vmProvider = require("../lib/vmProvider");
const bakerxProvider = require("../lib/bakerxProvider");
const { env } = require('process');
exports.command = 'prod up';
exports.desc = 'Create a production on the DigitalOcean';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;

    console.log("Check if the TOKEN exists")
    let token = process.env["PROVISION_TOKEN"] || '';
    if (token == ''){
        console.log(chalk.red("Fail to create the production because there is no PROVISION_TOKEN in .env"))
        return
    }

    let provider = null;
    if (processor == "Intel/Amd64") {
        provider = bakerxProvider
    } else {
        provider = vmProvider
    }
    let headers ={
        'Content-Type':'application/json',
        Authorization: 'Bearer ' + token
    };
    var name = "CSC519-M3-17"
	var region = "nyc1"; // Fill one in from #1
	var image = "ubuntu-20-04-x64"; // Fill one in from #2
    let sshKeys = await listSshKeys(headers);
    if(sshKeys.length == 0){
        console.log(chalk.red("You should upload a ssh key to your digital account"))
        return
    }

    // reset the server by delete existing one and create a new one
    await cleanExistDroplet(headers, name);
    await createDroplet(name,region,image, sshKeys[0], headers)

    async function cleanExistDroplet(headers, serverName){
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
    }

    async function deleteDroplet(id, headers)
	{
		if( typeof id != "number" )
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
			console.log(`Deleted droplet ${id}`);
		}

	}

    async function listSshKeys(headers){
		// console.log('#######list ssh keys#######');
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/account/keys', { headers: headers })
							 .catch(err => console.error(`listSshKeys ${err}`));
		if( !response ) return '';

        let sshIds = []

		response.data.ssh_keys.forEach(element => {
            sshIds.push(element.id);
		});
		console.log("sshs: " + sshIds);
        fs.writeFile('../inventory.txt', "sshIds: " + sshIds + "\n", (err) => {
          
            // In case of a error throw err.
            if (err) throw err;
        })
        return sshIds;
	}


    async function createDroplet (dropletName, region, imageName, sshKey, headers )
	{
		console.log('#######create droplet#######');
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
        // console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		// if( !response ) return;
        console.log(response);
		console.log(response.status);
		console.log(response.data);

		if(response.status == 202)
		{
            dropletId = response.data.droplet.id;
            var inventory =
                "connectionData :\n" + 
                  " dropletID: " + dropletId + "\n";

            fs.writeFile('../inventory.txt', inventory, (err) => {
          
                // In case of a error throw err.
                if (err) throw err;
            })
			console.log(chalk.green(`Created droplet id ${response.data.droplet.id}`));
		}
		// console.log('#######droplet info#######');
		if( typeof id != "number" )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		// Make REST request
		response = await axios.get('https://api.digitalocean.com/v2/droplets/'+id, { headers: headers })
				.catch(err => console.error(`dropletInfo ${err}`));
        console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		if( !response ) return;

		if( response.data.droplet )
		{
			let droplet = response.data.droplet;
            var ipv4IP;
            var ipv6IP;
            
            // Data to write to inventory file
            fs.appendFile('../inventory.txt', "dropletName: " + droplet.name + "\n", (err) => {
          
                // In case of a error throw err.
                if (err) throw err;
            })
			// Print out IP address
			droplet.networks.v4.forEach(ele =>{
                ipv4IP = ele.ip_address;
                fs.appendFile('../inventory.txt', "IPV4 IP Address: " + ipv4IP + "\n", function (err) {
                    if (err) throw err;
                  })
				// console.log(ipv4IP);
			})
			droplet.networks.v6.forEach(ele =>{
                ipv6IP = ele.ip_address;
                fs.appendFile('../inventory.txt', "IPV6 IP Address: " + ipv6IP + "\n", function (err) {
                    if (err) throw err;
                  })
				// console.log(ipv6IP);
			})
            console.log("Inventory Saved to: inventory.txt");
		}
	}
};
