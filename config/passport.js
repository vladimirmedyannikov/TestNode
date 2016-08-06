var LocalStrategy   = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;


var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
//var connection = mysql.createConnection(dbconfig.connection);

var connectionPool = mysql.createPool(dbconfig.connection);

//connection.query('USE ' + dbconfig.database);
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log("serialize");
        done(null, user);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        console.log("deserialize");
        connectionPool.getConnection(function(err, connection){
            var response = id;
            if (err){
                console.log(err);
                response.code = 500;
                response.code = "Error database;"
                return res.send(response);
            }
            connection.query("SELECT * FROM Users WHERE idUser = ? ",[id.user.idUser], function(err, rows){
                if (err){

                };
                if (rows.length){
                    response.code = 200,
                    response.message = "User signUp!";
                    response.user = {email:rows[0].email, idUser:rows[0].idUser};
                    done(err, response);
                }
                else {
                    response.code = 400;
                    response.message = "Register is not avaliable";
                    done(err, response);
                }

            });
        });

    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {
            // we are checking to see if the user trying to login already exists
            // find a user whose email is the same as the forms email
            console.log("req", req);
            connectionPool.getConnection(function(err, connection){
                if (err){
                    console.log(err);
                    return res.send("Error database :(");
                }
                connection.query("SELECT * FROM Users WHERE email = ?",[email], function(err, rows) {
                    if (err)
                        return done(err);
                    if (rows.length) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {
                        // if there is no user with that username
                        // create the user
                        var newUserMysql = {
                            email: email,
                            password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
                        };

                        var insertQuery = "INSERT INTO Users ( email, password ) values (?,?)";

                        connection.query(insertQuery,[newUserMysql.email, newUserMysql.password],function(err, rows) {
                            newUserMysql.id = rows.insertId;
                            if(err) console.log("Insert user",err);
                            return done(null, newUserMysql);
                        });
                    }
                });
            });
        })
    );

//// signup service
///-----------------
passport.use(
    'local-signup-service',
    new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        console.log(done);
        var response = {
            code : 0,
            message:"Unknown",
            user:{email:null,idUser:0}
        };
        console.log("req", req.body);
        connectionPool.getConnection(function(err, connection){
            if (err){
                console.log(err);
                //return res.send("Error database :(");
            }
            connection.query("SELECT * FROM Users WHERE email = ?",[email], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    response.code = 403;
                    response.message = "User is register";
                    response.user = {email:rows[0].email, idUser:rows[0].idUser};
                    req.body.user = response;
                    console.log("response", response);
                    return done(null, response);
                } else {
                    // if there is no user with that username
                    // create the user
                    var newUserMysql = {
                        email: email,
                        //password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
                        password : password
                    };
                    response.code = 200;
                    response.message = "User signup!!!";
                    response.user = newUserMysql;

                    var insertQuery = "INSERT INTO Users ( email, password ) values (?,?)";

                    connection.query(insertQuery,[newUserMysql.email, newUserMysql.password],function(err, rows) {
                        newUserMysql.idUser = rows.insertId;
                        if(err) console.log("Insert user",err);
                        return done(null, response);
                    });
                }
            });
        });
    })
);


    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form
            connectionPool.getConnection(function(err, connection){
                if (err){
                    console.log(err);
                    return res.send("Error database :(");
                }
                connection.query("SELECT * FROM Users WHERE email = ?",[email], function(err, rows){
                    if (err)
                        return done(err);
                    if (!rows.length) {
                        return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                    }
                    console.log(bcrypt.hashSync(password));
                    console.log(rows[0].password);
                    // if the user is found but the password is wrong
                    var hash = bcrypt.hashSync(password);
                    if (!bcrypt.compareSync(password, rows[0].password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                    // all is well, return successful user
                    return done(null, rows[0]);
                });
            });
        })
    );

    passport.use(new BasicStrategy(
        function(email, password, done){
            console.log("auth basic");
            connectionPool.getConnection(function(err, connection){
                if (err){
                    console.log(err);
                    return res.send("Error database :(");
                }
                connection.query("select * from Users where email = ?",[email], function(err, rows){
                    if (err) console.log("Error token user "+ err);
                    if (!rows.length) {
                        return done(null, false); // req.flash is the way to set flashdata using connect-flash
                    }
                    if (!password == rows[0].password){ return done(null, false);}
                    done(null, rows[0]);
                });
            });
        }
    ));

    passport.use(new ClientPasswordStrategy(
        function(idClient, password, done){
            console.log("auth password", idClient, password);
            connectionPool.getConnection(function(err, connection){
                if (err){
                    console.log(err);
                    return res.send("Error database :(");
                }
                connection.query("select * from Client where idClient = ?",[idClient], function(err, rows){
                    if (err) console.log("Error token user "+ err);
                    if (!rows.length) {
                        return done(null, false); // req.flash is the way to set flashdata using connect-flash
                    }
                    if (!password == rows[0].password){ return done(null, false);}
                    done(null, rows[0]);
                });
            });
        }
    ));

    //curl -i http://mangyst.ddns.net:3101/test -H "Authorization: Bearer gAsdfejcaVkiKF862WRK99WyAJ6ulvmgrRsL/AdkFJQ"


    passport.use(new BearerStrategy(
        function(accessToken, done){
            console.log("auth bearer", accessToken);
            connectionPool.getConnection(function(err, connection){
                if (err){
                    console.log(err);
                    return res.send("Error database :(");
                }
                console.log("token finding...");
                connection.query("select * from AccessToken where token = ?",[accessToken], function(err, rows){
                    if (err) console.log("Error token "+ err);
                    if (!rows.length) {
                        return done(null, false); // req.flash is the way to set flashdata using connect-flash
                    }
                    var token = rows[0];

                    console.log(Date.now(), token.created, Math.round((Date.now()-token.created)/1000));
                    if( Math.round((Date.now()-token.created)/1000) > 36000000 ) {
                        connection.query("Delete from AccessToken where token = ?",[accessToken], function(err, result){
                            if(err) {
                                console.log("Error", err);
                                return done(err);
                            }
                        });
                        console.log("token expired");
                        return done(null, false, { message: 'Token expired' });
                    }

                    connection.query("Select Users.idUser, Users.firstName, Users.lastName, Users.thirdName, " +
                            " Users.email, Users.token, Users.login, Users.urlImage, Users.urlImageThumb, Users.urlVk, " +
                            " Users.status, Users.phone, Users.about from Users where idUser = ?",[token.idUser], function(err, rows){
                        if (err) console.log("Error token user "+ err);
                        if (!rows.length) {
                            return done(null, false); // req.flash is the way to set flashdata using connect-flash
                        }
                        var info = {scope: '*'};
                        console.log(rows, token);
                        done(null, rows[0], info);
                    });
                });
            });
        }
    ));
};
