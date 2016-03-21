var express = require('express');
var route = express.Router();
var fs = require('fs');
var path = require('path');
var dir = path.resolve('.');

process.setMaxListeners(0);
require('events').EventEmitter.prototype._maxListeners = 0;

var mongoose = require('mongoose');

// route.use(function timeLog(req, res, next) {
//     next();
// });

//For single native models init
//mongoose.model('users', {name:String});
//mongoose.model('posts', {content:String});

mongoose.connect('mongodb://localhost/testuser');

fs.readdirSync(dir + '/models').forEach(function(filename){
    if (~filename.indexOf('.js')) require(dir + '/models/' + filename);
});

//route default
route.all('/', function(req, res) {
    return res.send("Hello MongoDB!");
});

//Route Initialize data
route.all('/users/:name', function(req, res) {
    var name = req.params.name;
    mongoose.model('users').find({name: new RegExp(name, 'i')},function(err, users){
        res.send(users);
    });
});

route.all('/users', function(req, res) {
    // mongoose.model('users').find(function(err, users){
    //         res.send(users);
    // });
    var users = mongoose.model('users');

    /*users.findOne().sort([['name', 'descending']]).exec(function(err,data){
        if (err) {
            console.log(err);
            return res.send(500);
        }

        console.log(JSON.stringify(data));
        count = data.name;
        console.log(parseInt(count));
    });*/


    mongoose.model('users').find().sort([['name', 'asc']]).populate('posts').exec(function(err, data){
        return res.render('users', {
            title: 'title',
            message: 'Количество слов',
            users: data
        });
    });
});


route.all('/init', function(req, res) {
    var Users = mongoose.model('users');
    var Posts = mongoose.model('posts');
    var count = 0;
    Users.count({}, function(err, data){
        if(err){
            console.log(err);
        }
        console.log(data);
        count = data;
        for (var i = 0; i < 10; i++) {
            var posts = [];

            var user = new Users({
                name: 'Name '+ (count + i),
                posts:posts
            });

            user.save(function(err, user){
                if (err) console.log("Err add " + err);
                console.log(user);
            });

            for (var j = 0; j < 3; j++) {
                var post = new Posts({
                    content:"Posts user " + user.name,
                    user:user._id
                });
                post.save(function(err){
                    if(err) console.log("Error post add ");
                });
                posts.push(post._id);
            }

            Users.update({_id:user._id}, {$set:{posts:posts}}, function(err){
                if (err) console.log(err);
            });
        }
    });

    res.send("Access");
});

module.exports = route;
