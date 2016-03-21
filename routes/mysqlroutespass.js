var express = require('express');
//var route = express.Router();
var fs = require('fs');
var path = require('path');
var dir = path.resolve('.');

var mysql = require('mysql');

var connectionPool = mysql.createPool({
    connectionLimit : 100,
    host : 'localhost',
    user : 'root',
    password : 'MAngysT<>Shadum123',
    database : 'homebank',
    debug : false
});


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
