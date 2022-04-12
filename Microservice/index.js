const express = require('express')
const app = express()
const port = 3000

const marqdown = require('./marqdown');

const fs = require('fs');

app.use(express.json());

app.get('/survey/:id', function(req,res)
{
    if( !req.params.id ) {
        res.send(`<html>Error: missing survey id</html>`)
    }
    
    let file = `test/resources/${req.params.id}`;
    fs.readFile( file , {}, (err, data) => {

        if( err ) {
            return res.send(`<html>Error: ${err.message}</html>`)
        }
        var text = marqdown.render( data.toString() );
        res.send( `<html>
            ${text}
        </html>`
        );
    });

})

app.post('/json', function(req,res)
{
    console.log(req.body.markdown);
    var text = marqdown.render( req.body.markdown );
    res.send( {preview: text} );
})

app.listen(port, () => console.log(`Microservice listening on http://localhost:${port}/preview`))