var express = require('express');

var app = express();

var fs = require('fs');
var _ = require("lodash");
var moment = require('moment');
var request = require('request');
// var Db = require('mongodb').Db;
// var MongoClient = require('mongodb').MongoClient;
// var Server = require('mongodb').Server;
var frequency = require("./libs/frequency.js");
var mongoroute = require('./routes/mongoroutes.js');
var mysqlroute = require('./routes/mysqlroutes.js');
var passport = require('passport');

var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');


require('./config/passport')(passport);

app.use(cookieParser());
app.use(session({
    secret: 'myLittleSecretKey',
    resave : true,
    saveUnitialized:true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var bodyParser = require('body-parser')
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.set('view engine', 'jade');

app.use('/mongo', mongoroute);
//app.use('/mysql', mysqlroute);
//require('./routes/mysqlroutespass.js')(app, passport);
require('./routes/mysqlroutespass2.js')(app, passport);

//require('./routes/v1.js')(app, passport);

var async = require('async');
require('events').EventEmitter.prototype._maxListeners = 0;

//Database Mongo create instance
//var db = new Db('mongotest', new Server('localhost',27017));
//
var testFile = fs.readFileSync("text.txt");

var answer = frequency.getCount(testFile.toString());
console.log(JSON.stringify(answer));

var html = fs.readFileSync("./index.html");

app.get('/user', function(req, res) {
    res.send(html.toString());
});

function stripTags(str) {
    var regularExpr = /(<([^>]+)>)/ig;
    return str.replace(regularExpr, "");
}

app.get('/', function(req, res) {
    return res.render('index', {
        title: 'Подсчет слов'
    });
});

app.all('/search', function(req, res) {
    var url =
        "https://ru.wikipedia.org/wiki/%D0%91%D0%B5%D0%BB%D0%B5%D1%86%D0%BA%D0%B8%D0%B9,_%D0%95%D0%B2%D0%B3%D0%B5%D0%BD%D0%B8%D0%B9_%D0%90%D0%BD%D0%B4%D1%80%D0%B8%D0%B0%D0%BD%D0%BE%D0%B2%D0%B8%D1%87";
    var urls = req.body.urls;
    urls = urls.split("\r\n");
    urls = _.filter(urls, function(url) {
         return url.length > 0
    })
    // console.log(urls);
    /*var urls = [
      "https://ru.wikipedia.org/wiki/%D0%91%D0%B5%D0%BB%D0%B5%D1%86%D0%BA%D0%B8%D0%B9,_%D0%95%D0%B2%D0%B3%D0%B5%D0%BD%D0%B8%D0%B9_%D0%90%D0%BD%D0%B4%D1%80%D0%B8%D0%B0%D0%BD%D0%BE%D0%B2%D0%B8%D1%87",
      "https://ru.wikipedia.org/wiki/%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D0%B9%D1%81%D0%BA%D0%B0%D1%8F_%D0%B8%D0%BC%D0%BF%D0%B5%D1%80%D0%B8%D1%8F"
  ];*/
    var words = [];
    async.map(urls, getCountFromUrls, function(err, arrayResult) {
        if (err) {
            console.log({
                err: err
            });
            return res.send(500, err);
        }
        var result = _.concat(words, arrayResult);
        result = _.flattenDepth(result, 2);
        return res.render('search', {
            title: 'title',
            message: 'Количество слов',
            words: result
        });
    });
});

function getCountFromUrls(url, next) {
    request({
        url: url
    }, function(error, response, body) {
        if (error) {
            return next("Error", error);
        }
        var text = body.toString();
        text = stripTags(text);
        var answer = frequency.getCount(text);
        next(null, answer);
        //console.log(body) // Show the HTML for the Google homepage.
        //return res.render('index',{title:'title',message:'Количество слов',words:answer})
    })
}

app.post('/', function(req, res) {
    res.send(html.toString());
});


app.post('/user', function(req, res) {
    //var par = req.param('firstName');
    var firstName = req.body.firstName;
    var email = req.body.email;
    var drink = req.body.drink;
    res.send(html.toString() + ' ' + firstName + ' ' + email +
        '. Drinked ' + drink);
});


app.listen(3101, function() {
    console.log('Example app listening on port 3101!  ' + moment(new Date())
        .format("DD-MM-YYYY:hh:mm:ss"));
});
