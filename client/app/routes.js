var path = require('path'),
        fs = require('fs');
var request = require('request');
var config = require('../config.json');

module.exports = function(app, passport, server) {
    app.get('/', function(request, response) {
        response.render('login.html');
    });
    
    app.post('/login', function(req, res) {
        var username = req.body.username;
        var password = req.body.username;



        var options = {
            method: 'POST',
            url: 'http://'+config.REST_HOST+':'+config.REST_HOST+'/api/login?username=' + username + '&password=' + password


        };
        request(options, function(error, response, body) {
            if (!error) {
               var resp = JSON.parse(body);
               if(resp.message.OK){
                   res.redirect('/dashboard');
               }else{
                   res.redirect('/');
               }
            } else {
                console.log({message: error});
            }
        });
    });


 app.get('/dashboard', function(request, response) {
        response.render('dashboard.html');
    });
    
     app.get('/createcert', function(request, response) {
        response.render('createcert.html');
    });
    
     app.post('/createcert', function(req, res) {
        var owner_name = req.body.owner_name;
        var unit_title = req.body.unit_title;
        var qual_identifier = req.body.qual_identifier;
        var unit_identifier = req.body.unit_identifier;
        var user_name = req.body.user_name;
        var cert_hash = '';



        var options = {
            method: 'POST',
            url: 'http://'+config.REST_HOST+':'+config.REST_HOST+'/api/regcertificate?owner_name=' + owner_name + '&unit_title=' + unit_title+ '&qual_identifier=' + qual_identifier+ '&unit_identifier=' + unit_identifier+ '&user_name=' + user_name+ '&cert_hash=' + cert_hash

        };
        request(options, function(error, response, body) {
            if (!error) {
               var resp = JSON.parse(body);
               if(resp.message.OK){
                   res.redirect('/dashboard');
               }
            } 
        });
    });
    
    
     app.get('/verifycert', function(request, response) {
        response.render('verifycert.html');
    });
    
     app.post('/verifycert', function(req, res) {
        var user_name = req.body.user_name;
        var cert_hash = req.body.cert_hash;



        var options = {
            method: 'POST',
            url: 'http://'+config.REST_HOST+':'+config.REST_HOST+'/api/searchbycert?user_name=' + user_name + '&cert_hash=' + cert_hash


        };
        request(options, function(error, response, body) {
            if (!error) {
               var resp = JSON.parse(body);
               if(resp.message.OK){
                  
               }
            } else {
                console.log({message: error});
            }
        });
    });


};
