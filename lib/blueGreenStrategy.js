const chalk = require('chalk');
const path = require('path');
const os = require('os');

const got = require('got');
const http = require('http');
const httpProxy = require('http-proxy');
const serverNames = {"GREEN": {}, "BLUE": {}};


class Production
{
   constructor() {
      this.GREEN = `http://${serverNames['GREEN'].HOSTIP}:8080`;
      this.BLUE = `http://${serverNames['BLUE'].HOSTIP}:8080`;
      this.TARGET = this.GREEN;
      setInterval( this.healthCheck.bind(this), 5000 );
   }

    // TASK 1: 
   proxy() {
      let options = {};
      let proxy   = httpProxy.createProxyServer(options);
      let self = this;
      // Redirect requests to the active TARGET (BLUE or GREEN)
      let server  = http.createServer(function(req, res)
      {
         proxy.web( req, res, {target: self.TARGET } );
         // callback for redirecting requests.
      });
      server.listen(3090);
   }

   failover()
   {
      this.TARGET = this.BLUE;
   }

   async healthCheck()
   {
      try 
      {
         const response = await got(`${this.TARGET}/iTrust2/login`, {throwHttpErrors: false});
         let status = response.statusCode == 200 ? chalk.green(response.statusCode) : chalk.red(response.statusCode);

         if(this.TARGET == this.GREEN && response.statusCode == 500) {
            this.failover();
         }
         console.log( chalk`{grey Health check on ${this.TARGET}}: ${status}`);
      }
      catch (error) {
         if(this.TARGET == this.GREEN) {
            this.failover();
         }
         console.log(error);
      }
   }
   
}

async function run() {
   console.log(chalk.keyword('pink')('Starting proxy on localhost:3090'));
   prod = new Production();
   prod.proxy();
}

module.exports = {serverNames, run};