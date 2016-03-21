var oauth2orize         = require('oauth2orize');
var passport            = require('passport');
var crypto              = require('crypto');

var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var path = require('path');
var dir = path.resolve('.');
var dbconfig = require(dir+'/config/database');

var connectionPool = mysql.createPool(dbconfig.connection);

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Exchange username & password for access token.
server.exchange(oauth2orize.exchange.password(function(client, email, password, scope, done) {
    connectionPool.getConnection(function(err, connection){
        if (err){
            console.log(err);
            return res.send("Error database :");
        }
        console.log("Auth oauth2", email);
        connection.query("SELECT * FROM Users WHERE email = ? ",[email], function(err, rows){
            if (err) { return done(err); }
            var user = rows[0];
            if (!user) { return done(null, false); }
            console.log(password, rows[0].password);
            if (password !== rows[0].password) { return done(null, false); }

            connection.query("Delete from RefreshToken where idUser = ? and clientId = ?",[user.idUser,client.idClient], function(err){
                if(err) {
                    console.log(err);
                    return done(err);
                }
            });

            connection.query("Delete from AccessToken where idUser = ? and clientId = ?",[user.idUser,client.idClient], function(err, result){
                if(err) {
                    console.log(err);
                    return done(err);
                }
            });

            var tokenValue = crypto.randomBytes(32).toString('base64');
            var refreshTokenValue = crypto.randomBytes(32).toString('base64');

            //var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: user.userId });
            //var refreshToken = new RefreshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: user.userId });

            connection.query("Insert into RefreshToken (idUser, clientId, token) values (?, ?, ?)",[user.idUser,client.idClient,refreshTokenValue], function(err, result){
                if(err) {
                    console.log(err);
                    return done(err);
                }
            });
            var info = { scope: '*' }
            connection.query("Insert into AccessToken (idUser, clientId, token) values (?, ?, ?)",[user.idUser,client.idClient,tokenValue], function(err, result){
                if(err) {
                    console.log(err);
                    return done(err);
                }
                done(null, tokenValue, refreshTokenValue, { 'expires_in': 3600 });
            });

            // token.save(function (err, token) {
            //     if (err) { return done(err); }
            //     //config.get('security:tokenLife')
            //     done(null, tokenValue, refreshTokenValue, { 'expires_in': 3600 });
            // });
        });
    });
}));
//grant_type=refresh_token client_id client_secret resresh_token
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
    console.log("token");
    done(null);
}));
// Exchange refreshToken for access token.
// server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
//     RefreshTokenModel.findOne({ token: refreshToken }, function(err, token) {
//         if (err) { return done(err); }
//         if (!token) { return done(null, false); }
//         if (!token) { return done(null, false); }
//
//         UserModel.findById(token.userId, function(err, user) {
//             if (err) { return done(err); }
//             if (!user) { return done(null, false); }
//
//             RefreshTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
//                 if (err) return done(err);
//             });
//             AccessTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
//                 if (err) return done(err);
//             });
//
//             var tokenValue = crypto.randomBytes(32).toString('base64');
//             var refreshTokenValue = crypto.randomBytes(32).toString('base64');
//             var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: user.userId });
//             var refreshToken = new RefreshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: user.userId });
//             refreshToken.save(function (err) {
//                 if (err) { return done(err); }
//             });
//             var info = { scope: '*' }
//             token.save(function (err, token) {
//                 if (err) { return done(err); }
//                 done(null, tokenValue, refreshTokenValue, { 'expires_in': config.get('security:tokenLife') });
//             });
//         });
//     });
// }));


// token endpoint
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
]
