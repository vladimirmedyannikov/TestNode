var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = new Schema({
    name:String,
    posts:[{
        type:Schema.ObjectId,
        ref:'posts'
    }]
});

mongoose.model('users', usersSchema);
