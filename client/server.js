//renju vm

var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var config = require('./config.json');
var request = require('request');
var path = require('path'),
        fs = require('fs');
var http = require('http');
var server = http.createServer(app);


app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


require('./app/routes.js')(app, server);

var regurl = 'https://' + config.network_id + '-' + config.reg_peer;
var blockurl = 'https://' + config.network_id + '-' + config.block_peer;

// configure app to use bodyParser()
// this will let us get the data from a POST


var port = process.env.PORT || config.REST_PORT;        // set our port

//router

var router = express.Router();

//routing

router.use(function(req, res, next) {

    console.log('OK');
    next();
});


//certificate creation

router.route('/regcertificate')
        .post(function(req, res) {

    var owner_name = req.query.owner_name;
    var unit_title = req.query.unit_title;
    var qual_identifier = req.query.qual_identifier;
    var unit_identifier = req.query.unit_identifier;
    var user_name = req.query.user_name;
    var cert_hash = req.query.cert_hash;

    var data = {
        "jsonrpc": "2.0",
        "method": "invoke",
        "params": {
            "type": 1,
            "chaincodeID": {
                "name": config.chaincode_id
            },
            "ctorMsg": {
                "function": "init_cert",
                "args": [
                    owner_name,
                    unit_title,
                    qual_identifier,
                    unit_identifier,
                    user_name,
                    cert_hash
                ]
            },
            "secureContext": "user_type1_0"
        },
        "id": 0
    }

    http_post(blockurl, data, res);

});

//search by certificate

router.route('/searchbycert')
        .post(function(req, res) {

  
    var cert_hash = req.query.cert_hash;


    var data = {
        "jsonrpc": "2.0",
        "method": "invoke",
        "params": {
            "type": 1,
            "chaincodeID": {
                "name": config.chaincode_id
            },
            "ctorMsg": {
                "function": "find_cert",
                "args": [
                    cert_hash
                ]
            },
            "secureContext": "user_type1_0"
        },
        "id": 0
    }

    http_post(blockurl, data, res);

});

//search by user

router.route('/searchbyname')
        .post(function(req, res) {

    var user_name = req.query.user_name;

    var data = {
        "jsonrpc": "2.0",
        "method": "query",
        "params": {
            "type": 1,
            "chaincodeID": {
                "name": config.chaincode_id
            },
            "ctorMsg": {
                "function": "read",
                "args": [
                    user_name
                ]
            },
            "secureContext": "user_type1_0"
        },
        "id": 0
    }

    http_post(blockurl, data, res);

});

//user login

router.route('/login')
        .post(function(req, res) {

    var username = req.query.username;
    var password = req.query.password;


    var data = {
        "enrollId": username,
        "enrollSecret": password
    }

    http_post(regurl, data, res);

});

//rest uri

app.use('/api', router);


//internal method for request handling
function http_post(post_url, block_data, res) {

    var options = {
        method: 'POST',
        url: post_url,
        headers: {
            'Content-Type': 'application/json'
        },
        json: block_data

    };
    request(options, function(error, response, body) {
        if (!error) {
            res.json({message: body});

        } else {
            res.json({message: error});
        }
    });

}

//start the server

app.listen(port);
console.log('Rest server started on port ' + port);
