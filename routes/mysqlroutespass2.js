var express = require('express');
//var route = express.Router();
var fs = require('fs');
var path = require('path');
var dir = path.resolve('.');
var oauth2 = require(dir+'/libs/oauth2');
var mysql = require('mysql');
var gcm = require('node-gcm');
var _ = require("lodash");

var connectionPool = mysql.createPool({
    connectionLimit : 100,
    host : 'localhost',
    user : 'root',
    password : 'MAngysT<>Shadum123',
    database : 'homebank',
    debug : false
});

function getBill(connection, billId){
    connection.query("SELECT * FROM Bills WHERE idBill = ? ",[billId], function(err, rows){
        if (err){ console.log(err);}
        var bill = rows[0];
        console.log("Id = " + billId);
        return rows[0];
    });
}

function sendNotification(message, idUser){
    var sender = new gcm.Sender('AIzaSyAldfFS1fnY-l0ugk1f4fvcGU7TslhlGd4');
    var registrationTokens = [];
    console.log(idUser);
    connectionPool.getConnection(function(err, connection){
        if (err){
            console.log(err);
            //return res.status(400);
        }
        connection.query("Select token from gcm_tokens where id_user = ?",[idUser],function(err, rows){
            if (err){
                console.log(err);
                //return res.status(400);
            }
         //registrationTokens = rows.map(function (item) { return item.token; });
         rows.forEach(function(item, i, arr) {
            registrationTokens.push(item.token);
        });
        console.log(registrationTokens);
        // Send the message
        // ... trying only once
        sender.sendNoRetry(message, { registrationTokens: registrationTokens }, function(err, response) {
          if(err) console.log("error gcm", err);
          else    console.log("gcm response", response);
        });
    })

});
    // Add the registration tokens of the devices you want to send to
    //var registrationTokens = [];
    //registrationTokens.push('cHBNuSrQWLE:APA91bHu-8sxx4TvmPUHitKxD8d5LEd4bfEnazmQGkEPRs1XOEQAn5R4sRVzsUHu-lstpatw0MtRXRckdOvvKTHt_lzRfoZ_FjBk9v3GrikJJ5_6FqfxeMfYBpR3QDxHE5J8R5Wj4Cke');
}

module.exports = function(route, passport){
    route.get('/mysql/login', function(req, res){
        res.render('login', {message: req.flash('loginMessage')});
    });

    route.post('/mysql/login', passport.authenticate('local-login',{
        successRedirect:'/mysql/bills/list',
        failureRedirect:'/mysql/login',
        failureFlash: true
    }),

    function(req, res){
        if(req.body.remember){
            req.session.cookie.maxAge = 1000 * 60 * 3;
        }else {
            req.session.cookie.expires = false;
        }
        res.redirect('/');
    });

    route.get('/mysql/signup', function(req, res){
        res.render('signup', {message:req.flash('signupMessage')});
    });

    route.post('/mysql/signup', passport.authenticate('local-signup' ,{
        successRedirect:'/mysql/bills/list',
        failureRedirect:'/mysql/signup',
        failureFlash: true
    }));

    /*route.post('/mysql/service/signup', passport.authenticate('local-signup-service' ,{
        successRedirect:'/mysql/completesignup',
        failureRedirect:'/mysql/errorsignup',
        passReqToCallback : true,
        failureFlash: true,
        session: true
}));*/

route.post("/mysql/service/signup",
    passport.authenticate("local-signup-service"),
    function (req, res) {
        console.log(req);
        res.send(req.user);
});

    route.get('/mysql/completesignup', function(req, res){
        console.log("completesignup " ,req);
        var response = req.user;
        res.json(response);
    });

    route.get('/mysql/errorsignup', function(req, res){

        var response = req.flash('signupMessage');

        var json = JSON.stringify(response[0]);
        console.log("errorsignup", json);
        res.send(json);
    });

    route.post('/oauth/token', oauth2.token, function(res, req){
        console.log(req);
        res.send("its good!");
    });

    route.all('/mysql/gcm/register',
        function(req, res) {
            //console.log("auth bearer", req);
            var accessToken = "";
            if (req.headers && req.headers.authorization) {
              var parts = req.headers.authorization.split(' ');
              if (parts.length == 2) {
                var scheme = parts[0]
                  , credentials = parts[1];

                if (/^Bearer$/i.test(scheme)) {
                  accessToken = credentials;
                }
              } else {
                  res.status(400);
              }
            }
            connectionPool.getConnection(function(err, connection){
                if (err){
                    console.log(err);
                    return res.status(400);
                }
                console.log("token finding...");
                connection.query("select * from AccessToken where token = ?",[accessToken], function(err, rows){
                    if (err) console.log("Error token "+ err);
                    if (!rows.length) {
                        return res.status(400); // req.flash is the way to set flashdata using connect-flash
                    }
                    var token = rows[0];

                    console.log(Date.now(), token.created, Math.round((Date.now()-token.created)/1000));
                    if( Math.round((Date.now()-token.created)/1000) > 36000000 ) {
                        res.status(400);
                    }

                    /*connection.query("Select Users.idUser, Users.firstName, Users.lastName, Users.thirdName, " +
                            " Users.email, Users.token, Users.login, Users.urlImage, Users.urlImageThumb, Users.urlVk, " +
                            " Users.status, Users.phone, Users.about from Users where idUser = ?",[token.idUser], function(err, rows){
                        if (err) console.log("Error token user "+ err);
                        if (!rows.length) {
                            res.code(400);
                        }
                        var info = {scope: '*'};
                        console.log(rows, token);

                    });*/
                    connection.query("Select token, id_user from gcm_tokens where id_user = ? and token = ?",
                        [token.idUser, req.body.token],
                        function(err, rows){
                            if (err){
                                res.status(400);
                            }
                            console.log(req.body.token);
                            if (rows.length){
                                connection.query("Delete from gcm_tokens where id_user = ? and token = ?",
                                    [token.idUser, req.body.token],
                                    function(err, result){
                                        if (err){
                                            res.status(400);
                                        }
                                        console.log("token deleted", result);
                                    });
                            }
                            else {
                                var insertId = 0;
                                connection.query("Insert into gcm_tokens (token, id_user)  values (?,?)",
                                    [req.body.token, token.idUser],
                                    function(err, result){
                                        if (err){
                                            res.status(400);
                                        }
                                        insertId = result.insertId;
                                        console.log("token register", result);
                                    });
                            }
                        });
                });
            });

            // req.authInfo is set using the `info` argument supplied by
            // `BearerStrategy`.  It is typically used to indicate scope of the token,
            // and used in access control checks.  For illustrative purposes, this
            // example simply returns the scope in the response.
            //res.json({ user_id: req.user, name: req.user.email, scope: req.authInfo.scope })
            res.json(req.user);
        }
    );

    route.get('/test',
    passport.authenticate('bearer', { session: false }),
        function(req, res) {
            //console.log("auth bearer", req.query);
            // req.authInfo is set using the `info` argument supplied by
            // `BearerStrategy`.  It is typically used to indicate scope of the token,
            // and used in access control checks.  For illustrative purposes, this
            // example simply returns the scope in the response.
            //res.json({ user_id: req.user, name: req.user.email, scope: req.authInfo.scope })
            res.json(req.user);
        }
);





    route.all('/mysql', function(req, res){
        connectionPool.getConnection(function(err, connection){
            if (err){
                console.log(err);
                return res.send("Error database :(");
            }
            connection.query('Select * from Bills', function(err, rows){
                console.log(rows);
                res.json(err);
            });
            connection.release();
        })
    });


route.get('/mysql/bills/:id', passport.authenticate('bearer', {session:false}),
    function(req, res) {
        var idBill = req.params.id;
        connectionPool.getConnection(function(err, connection) {
            if (err) {
                console.log(err)
                return res.send("Error database");
            }

            connection.query("Select * From Bills where idBill = ?",[idBill], function(err, result) {
                res.json(result);
            });
        });
    }
);


route.get('/mysql/bills', passport.authenticate('bearer', {session: false}),
function(req, res) {
    var user = req.user
    connectionPool.getConnection(function(err, connection) {
        if (err) {
            return res.send("Error database")
        }
        connection.query("Select * from Bills where idUser = ?",[user.idUser], function(err, result){
            return res.json(result);
        });

    });

}

);

    route.post('/mysql/bills', function(req, res){
        console.log("lol");
        var idUser = 0;
        connectionPool.getConnection(function(err, connection){
            if (err){
                console.log(err);
                return res.send("Error database:");
            }
            var account = req.body.account;
            console.log(req);

            connection.query("SELECT * FROM Users WHERE email = ? ",[account.email], function(err, rows){
                if (err) { console.log(err); }
                var user = rows[0];
                idUser = user.idUser;
                var insertId = 0;
                connection.query("Insert into Bills (about, name, summvalue, idUser) values (?, ?, ?, ?)",
                [req.body.about, req.body.name, req.body.summvalue, user.idUser],
                function(err, result){
                    if(err) {
                        console.log(err);
                    }
                    insertId = result.insertId;

                    console.log(insertId);
                    console.log(user);

                    connection.query("SELECT * FROM Bills WHERE idBill = ? ",[insertId], function(err, rows,fields){
                        if (err){ console.log(err);}
                        connection.release();
                        var bill = rows[0];

                        var message = new gcm.Message({
                            data: {
                                key1: 'message1',
                                key2: 'message2'
                            },
                            notification: {
                                title: "Добавлен новый счет",
                                icon: "ic_launcher",
                                body: bill.name
                            }
                        });
                        console.log(message, idUser);
                        sendNotification(message, idUser);
                    });
                });
            });
        })
    });

    route.get('/mysql/users/list', function(req, res){
        connectionPool.getConnection(function(err, connection){
            if (err){
                console.log(err);
                return res.send("Error database :(");
            }
            connection.query('Select * from Users', function(err, rows){
                if (err){
                    console.log(err);
                    return res.send("Error database :(");
                }
                res.json(rows);
            });
            connection.release();
        })
    });

    route.get('/mysql/bills/list', isLoggedIn,function(req, res){
        connectionPool.getConnection(function(err, connection){
            if (err){
                console.log(err);
                return res.send("Error database :(");
            }
            connection.query('Select * from Bills', function(err, rows){
                if (err){
                    console.log(err);
                    return res.send("Error database :(");
                }
                res.json(rows);
            });
            connection.release();
        })
    });
};

function isLoggedIn(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect('/mysql');
}
