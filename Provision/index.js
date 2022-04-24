const axios    = require("axios");
const chalk  = require('chalk');
const os     = require('os');
const fs = require('fs')

// Command to run to connection to droplet (instance)
// ssh -i path/to/private/key root@ip.address.of.instance

var config = {};
// Retrieve our api token from the environment variables.
config.token = "dop_v1_f763a806ee6ae57278e86686c6e74a4bbe7bdc28035e19358db4c9323b74e190";
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

    async listSshKeys( )
	{
		// console.log('#######list ssh keys#######');
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/account/keys', { headers: headers })
							 .catch(err => console.error(`listSshKeys ${err}`));
		if( !response ) return;

		response.data.ssh_keys.forEach(element => {
            sshIds.push(element.id);
			// console.log(element.id);
		});
        console.log("sshs: " + sshIds);
        fs.writeFile('inventory.txt', "sshIds: " + sshIds + "\n", (err) => {
          
            // In case of a error throw err.
            if (err) throw err;
        })
	}

	async createDroplet (dropletName, region, imageName )
	{
		// console.log('#######create droplet#######');
		if( dropletName == "" || region == "" || imageName == "" )
		{
			// console.log( chalk.red("You must provide non-empty parameters for createDroplet!") );
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

		// console.log("Attempting to create: "+ JSON.stringify(data) );

		let response = await axios.post("https://api.digitalocean.com/v2/droplets", 
		data,
		{
			headers:headers,
		}).catch( err => 
			console.error(chalk.red(`createDroplet: ${err}`)) 
		);
        // console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		// if( !response ) return;
        // console.log(response);
		// console.log(response.status);
		// console.log(response.data);

		if(response.status == 202)
		{
            dropletId = response.data.droplet.id;
            var inventory = "dropletID: " + dropletId + "\n";

            fs.appendFile('inventory.txt', inventory, (err) => {
          
                // In case of a error throw err.
                if (err) throw err;
            })
			console.log(chalk.green(`Created droplet id ${response.data.droplet.id}`));
		}
	}

	async dropletInfo (id)
	{
		// console.log('#######droplet info#######');
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
            fs.appendFile('inventory.txt', "dropletName: " + droplet.name + "\n", (err) => {
          
                // In case of a error throw err.
                if (err) throw err;
            })
			// Print out IP address
			droplet.networks.v4.forEach(ele =>{
                ipv4IP = ele.ip_address;
                fs.appendFile('inventory.txt', "IPV4 IP Address: " + ipv4IP + "\n", function (err) {
                    if (err) throw err;
                  })
				// console.log(ipv4IP);
			})
			droplet.networks.v6.forEach(ele =>{
                ipv6IP = ele.ip_address;
                fs.appendFile('inventory.txt', "IPV6 IP Address: " + ipv6IP + "\n", function (err) {
                    if (err) throw err;
                  })
				// console.log(ipv6IP);
			})
            console.log("Inventory Saved to: inventory.txt");
		}
	}

	async deleteDroplet(id)
	{
        console.log("Recieved " + id);
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

async function provisionInstance() {
    let client = new DigitalOceanProvider();
    await client.listSshKeys();
    var name = "jiln36"+os.hostname();
	var region = "nyc1";
	var image = "ubuntu-20-04-x64";
	await client.createDroplet(name, region, image);
    await client.dropletInfo(dropletId);
}

async function deleteInstance() {
    let client = new DigitalOceanProvider();
    var id;
    await fs.readFile('inventory.txt', 'utf-8', (err, data) => {
        if (err) throw err;
      
        // Converting Raw Buffer to text
        // data using tostring function.
        var id = parseInt(data.split('\n')[1].split(" ")[1]);
        client.deleteDroplet(id);
    })
}

// Run workshop code...
(async () => {
    // await provisionInstance();
	await deleteInstance();
})();
