var express = require('express');
var route = express.Router();
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

route.get('/login', function(req, res){

});

route.all('/', function(req, res){
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

route.get('/users/list', function(req, res){
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

route.get('/bills/list', function(req, res){
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

module.exports = route;
