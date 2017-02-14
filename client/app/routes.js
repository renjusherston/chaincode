var path = require('path'),
        fs = require('fs');
var request = require('request');
var config = require('../config.json');
var localStorage = require('localStorage');

var pdf = require('html-pdf');
var md5File = require('md5-file');

var fileUpload = require('express-fileupload');



module.exports = function(app, passport, server) {
app.use(fileUpload());
    //login landing  
    app.get('/', function(req, resp) {

        resp.render('login.html', {er: req.param("er")});
    });

//login handler
    app.post('/login', function(req, res) {
        var username = req.body.username;
        var password = req.body.password;


        var options = {
            method: 'POST',
            url: 'http://' + config.REST_HOST + ':' + config.REST_PORT + '/api/login?username=' + username + '&password=' + password
        };

        request(options, function(error, response, body) {
            if (!error) {
                var resp = JSON.parse(body);
                if (resp.message.OK) {

                    localStorage.setItem("user", username);
                    res.redirect('/dashboard');
                } else {

                    res.redirect('/?er=1');
                }
            } else {
                console.log({message: error});
            }
        });

    });

//dashboard landing
    app.get('/dashboard', function(request, response) {

        response.render('dashboard.html', {username: localStorage.getItem("user")});

    });

//certificate download
    app.get('/downloadfile', function(req, res) {


        res.download('./uploads/certificate.pdf');
    });

//create certificate landing screen
    app.get('/createcert', function(req, response) {
        response.render('createcert.html', {er: req.param("er"), msg: req.param("msg")});
    });

//create certificate handler
    app.post('/createcert', function(req, res) {
        var owner_name = req.body.owner_name;
        var unit_title = req.body.unit_title;
        var qual_identifier = req.body.qual_identifier;
        var unit_identifier = req.body.unit_identifier;
        var user_name = req.body.user_name;
        var cert_hash = '';

        var html = "<html>\n\
<head><title>Certificate</title></head>\n\
<body>\n\
<p style='text-align:center; font-weight: bold; color:brown; font-size:15px;'>" + owner_name + "</p>\n\
<p  style='text-align:center; font-weight: bold; color:blue;font-size:18px;'>Unit Title: " + unit_title + "</p>\n\
<p  style='text-align:center; font-weight: bold;font-size:12px;'>Qualification Identification: " + qual_identifier + "</p>\n\
<p  style='text-align:center; font-weight: bold;font-size:12px;'>Unit Identification: " + unit_identifier + "</p>\n\
<p  style='text-align:center; font-weight: bold; font-size:15px;'>Issued to " + user_name + "</p>\n\
</body>\n\
</html>";
        var options = {format: 'Letter'};
        pdf.create(html, options).toFile('./uploads/certificate.pdf', function(err, res) {
            if (err)
                return console.log(err);

        });

        /* hash certificate */
        var hash = md5File.sync('./uploads/certificate.pdf');
        cert_hash = hash;

        console.log('gen: '+cert_hash)

        var options = {
            method: 'POST',
            url: 'http://' + config.REST_HOST + ':' + config.REST_PORT + '/api/regcertificate?owner_name=' + owner_name + '&unit_title=' + unit_title + '&qual_identifier=' + qual_identifier + '&unit_identifier=' + unit_identifier + '&user_name=' + user_name + '&cert_hash=' + cert_hash

        };
        request(options, function(error, response, body) {
            if (!error) {
                var resp = JSON.parse(body);


                if (resp.message.result.status) {
                    res.redirect('/createcert?msg=' + resp.message.result.message);
                } else {
                    res.redirect('/createcert?er=1');
                }
            }
        });
    });

    //certificate verification landing screen
    app.get('/verifycert', function(request, response) {
        response.render('verifycert.html');
    });

//certificate verification handler
    app.post('/verifycert', function(req, res) {

        var certFile;
        var cert_hash;
        var user_name;
         var options;

        if (req.files) {
            certFile = req.files.certificate;

            
            certFile.mv('./uploads/verify/certificate.pdf', function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log('File uploaded!');
                }
            });


            /* hash certificate */
            var hash = md5File.sync('./uploads/verify/certificate.pdf');
            cert_hash = hash;

            console.log('ver: '+cert_hash);

        }

        user_name = req.body.user_name;


        if(user_name){
        options = {
            method: 'POST',
            url: 'http://' + config.REST_HOST + ':' + config.REST_PORT + '/api/searchbyname?user_name=' + user_name + '&cert_hash=' + cert_hash
        };
        }else{
           options = {
            method: 'POST',
            url: 'http://' + config.REST_HOST + ':' + config.REST_PORT + '/api/searchbycert?cert_hash=' + cert_hash
        };  
        }
        request(options, function(error, response, body) {
            if (!error) {

                var resp = JSON.parse(body);

              console.log(resp);

                if (resp.message.OK) {
                    res.redirect('/verifycert?msg=' + resp.message.result.message);
                } else {
                    res.redirect('/verifycert?er=1');
                }
            } else {
                console.log({message: error});
                res.redirect('/verifycert?er=1');
            }
        });
    });


};
