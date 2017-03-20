var path = require('path'),
        fs = require('fs');
var request = require('request');
var config = require('../config.json');
var localStorage = require('localStorage');

var pdf = require('html-pdf');
var md5File = require('md5-file');
var fileUpload = require('express-fileupload');
var pshell = require('python-shell');


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
        authcheck(response);
        response.render('dashboard.html', {username: localStorage.getItem("user")});

    });

//certificate download
    app.get('/downloadfile', function(req, res) {


        res.download('./uploads/certificate.pdf');

        res.redirect('/dashboard');


    });

//create certificate landing screen
    app.get('/createcert', function(req, response) {

        authcheck(response);

        response.render('createcert.html', {er: req.param("er"), msg: req.param("msg")});
    });

//create certificate handler
    app.post('/createcert', function(req, res) {

      fs.unlink('./uploads/certificate.pdf', function(err) {
      if (err)
      return console.log(err);
      console.log('file deleted successfully');
      });

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

                var hashfile ='uploads/certificate.pdf';
                var options = {
                  mode: 'text',
                  pythonOptions: ['-u'],
                  scriptPath: './',
                  args: [hashfile]
              };

                  var hash='';
                  pshell.run('fhash.py', options, function(err, results) {
                      if (err)
                        console.log({status: 'Failed'});

                      if (results) {
                           hash = results.toString();

                           var options = {
                               method: 'POST',
                               url: 'http://' + config.REST_HOST + ':' + config.REST_PORT + '/api/regcertificate?owner_name=' + owner_name + '&unit_title=' + unit_title + '&qual_identifier=' + qual_identifier + '&unit_identifier=' + unit_identifier + '&user_name=' + user_name + '&cert_hash=' + hash

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
                      }
                  });



        });

    });

    //certificate verification landing screen
    app.get('/verifycert', function(req, response) {

      authcheck(response);

        var er;
        var respdata;
        if (req.param("msg") && req.param("msg") != 'undefined') {
            respdata = JSON.parse(req.param("msg"));
        } else {
            respdata = req.param("msg");
        }
        if (req.param("er")) {
            er = req.param("er");
        }
        if (req.param("msg") == 'undefined') {
            er = 1;
        }

        response.render('verifycert.html', {er: er, msg: respdata});

    });

//certificate verification handler
    app.post('/verifycert', function(req, res) {

        var certFile;
        var cert_hash;
        var user_name;
        var options;

        user_name = req.body.user_name;

        if (user_name) {
            options = {
                method: 'POST',
                url: 'http://' + config.REST_HOST + ':' + config.REST_PORT + '/api/searchbyname?user_name=' + user_name
            };

            request(options, function(error, response, body) {
                if (!error) {

                    var resp = JSON.parse(body);

                    console.log(resp);

                    if (resp.message.result) {
                        res.redirect('/verifycert?msg=' + resp.message.result.message);

                    } else {
                        res.redirect('/verifycert?er=1');

                    }
                } else {
                    console.log({message: error});
                    res.redirect('/verifycert?er=1');

                }
            });
        } else {

            if (req.files) {
                certFile = req.files.certificate;


                if (certFile) {
                    certFile.mv('./uploads/verify/certificate.pdf', function(err) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log('File uploaded!');
                        }
                    });


                    /* hash certificate */
                    //var hash = md5File.sync('./uploads/verify/certificate.pdf');
                    //cert_hash = hash;

                    //cert_hash = localStorage.getItem("cert_hash");

                    var hashfile ='uploads/verify/certificate.pdf';
                    var options = {
                      mode: 'text',
                      pythonOptions: ['-u'],
                      scriptPath: './',
                      args: [hashfile]
                  };

                      var hash='';
                      pshell.run('fhash.py', options, function(err, results) {
                          if (err)
                            console.log({status: 'Failed'});
                          if (results) {
                               hash = results.toString();
                               console.log('ver: ' + hash);

                               options = {
                                   method: 'POST',
                                   url: 'http://' + config.REST_HOST + ':' + config.REST_PORT + '/api/searchbycert?cert_hash=' + hash
                               };
                               request(options, function(error, response, body) {
                                   if (!error) {

                                       var resp = JSON.parse(body);

                                       console.log(resp);

                                       if (resp.message.result) {
                                           res.redirect('/verifycert?msg=' + resp.message.result.message);
                                       } else {
                                           res.redirect('/verifycert?er=1');
                                       }
                                   } else {
                                       console.log({message: error});
                                       res.redirect('/verifycert?er=1');
                                   }
                               });
                          }
                      });


                }
            }


        }

    });

      app.get('/logout', function(req, response) {
        localStorage.setItem("user", '');
        response.redirect('/');
      });

    function authcheck(res){
      if(!localStorage.getItem("user")){
        res.redirect('/');
      }

    }

};
