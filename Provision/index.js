const axios    = require("axios");
const chalk  = require('chalk');
const os     = require('os');
const fs = require('fs')

var config = {};
// Retrieve our api token from the environment variables.
config.token = "dop_v1_f763a806ee6ae57278e86686c6e74a4bbe7bdc28035e19358db4c9323b74e190";
var ssh_fingerprint = "40:dd:11:a4:03:cc:5f:7c:bd:c2:a7:7a:00:85:03:21/6uRW0o";
var dropletId = 0;
var sshIds = [];

if( !config.token )
{
	console.log(chalk`{red.bold NCSU_DOTOKEN is not defined!}`);
	console.log(`Please set your environment variables with appropriate token.`);
	console.log(chalk`{italic You may need to refresh your shell in order for your changes to take place.}`);
	process.exit(1);
}

console.log(chalk.green(`Your token is: ${config.token.substring(0,4)}...`));

// Configure our headers to use our token when making REST api requests.
const headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};


class DigitalOceanProvider
{
	async listRegions()
	{
		let response = await axios.get('https://api.digitalocean.com/v2/regions', { headers: headers })
							 .catch(err => console.error(`listRegions ${err}`));
							 
		if( !response ) return;

		// console.log( response.data );
		
		if( response.data.regions )
		{
			for( let region of response.data.regions)
			{
				console.log(region.slug, region.name)
			}
		}

		if( response.headers )
		{
			console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		}
	}

	async listImages( )
	{
		console.log('#######list images#######');
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/images?type=distribution&per_page=100', { headers: headers })
							 .catch(err => console.error(`listImages ${err}`));
		if( !response ) return;

		response.data.images.forEach(element => {
			console.log(element.slug);
		});
	}

    async listSshKeys( )
	{
		console.log('#######list ssh keys#######');
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/account/keys', { headers: headers })
							 .catch(err => console.error(`listSshKeys ${err}`));
		if( !response ) return;

		response.data.ssh_keys.forEach(element => {
            sshIds.push(element.id);
			console.log(element.id);
		});
        console.log("sshs: " + sshIds);
	}

	async createDroplet (dropletName, region, imageName )
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
			"ssh_keys": sshIds,
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

            fs.writeFile('inventory.txt', inventory, (err) => {
          
                // In case of a error throw err.
                if (err) throw err;
            })
			console.log(chalk.green(`Created droplet id ${response.data.droplet.id}`));
		}
	}

	async dropletInfo (id)
	{
		console.log('#######droplet info#######');
		if( typeof id != "number" )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		// Make REST request
		let response = await axios.get('https://api.digitalocean.com/v2/droplets/'+id, { headers: headers })
				.catch(err => console.error(`dropletInfo ${err}`));
        console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		if( !response ) return;

		if( response.data.droplet )
		{
			let droplet = response.data.droplet;
            var ipv4IP;
            var ipv6IP;
            
            // Data to write to inventory file
            fs.appendFile('inventory.txt', " dropletName: " + droplet.name + "\n", (err) => {
          
                // In case of a error throw err.
                if (err) throw err;
            })

			// Print out IP address
			droplet.networks.v4.forEach(ele =>{
                ipv4IP = ele.ip_address;
                fs.appendFile('inventory.txt', " IPV4 IP Address: " + ipv4IP + "\n", function (err) {
                    if (err) throw err;
                  })
				console.log(ipv4IP);
			})
			droplet.networks.v6.forEach(ele =>{
                ipv6IP = ele.ip_address;
                fs.appendFile('inventory.txt', " IPV6 IP Address: " + ipv6IP + "\n", function (err) {
                    if (err) throw err;
                  })
				console.log(ipv6IP);
			})
		}
	}

	async deleteDroplet(id)
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

};


async function provision()
{
	let client = new DigitalOceanProvider();

	// #############################################
	// #1 Print out a list of available regions
	// Comment out when completed.
	// https://developers.digitalocean.com/documentation/v2/#list-all-regions
	// use 'slug' property
	// await client.listRegions();

	// #############################################
	// #2 Extend the client object to have a listImages method
	// Comment out when completed.
	// https://developers.digitalocean.com/documentation/v2/#images
	// - Print out a list of available system images, that are AVAILABLE in a specified region.
	// - use 'slug' property or id if slug is null
	// await client.listImages();

    await client.listSshKeys();

	// #############################################
	// #3 Create an droplet with the specified name, region, and image
	// Comment out when completed. ONLY RUN ONCE!!!!!
	var name = "jiln36"+os.hostname();
	var region = "nyc1"; // Fill one in from #1
	var image = "ubuntu-20-04-x64"; // Fill one in from #2
	await client.createDroplet(name, region, image);

	// Record the droplet id that you see print out in a variable.
	// We will use this to interact with our droplet for the next steps.
	// var dropletId = 286165217;

	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// BEFORE MOVING TO STEP FOR, REMEMBER TO COMMENT OUT THE `createDroplet()` call!!!

	// #############################################
	// #4 Extend the client to retrieve information about a specified droplet.
	// Comment out when done.
	// https://developers.digitalocean.com/documentation/v2/#retrieve-an-existing-droplet-by-id
	// REMEMBER POST != GET
	// Most importantly, print out IP address!
	await client.dropletInfo(dropletId);
	
	// #############################################
	// #5 In the command line, ping your server, make sure it is alive!
	// ping xx.xx.xx.xx

	// #############################################
	// #6 Extend the client to DESTROY the specified droplet.
	// https://developers.digitalocean.com/documentation/v2/#delete-a-droplet
	// await client.deleteDroplet(dropletId);

	// #############################################
	// #7 In the command line, ping your server, make sure it is dead!
	// ping xx.xx.xx.xx
}


// Run workshop code...
(async () => {
	await provision();
})();
