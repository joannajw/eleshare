var mongoose = require('mongoose'); 
var crypto = require('crypto'); 
var jwt = require('jsonwebtoken'); 

var userPost = new mongoose.Schema({
  title: String,
  link: String,
  author: String, 
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  categories: [String]
});

var UserSchema = new mongoose.Schema({
    username: {type: String, lowercase: true, unique: true}, 
    hash: String, 
    salt: String,
    categories: [String]
    // posts: []
});

UserSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex'); 
    // password, salt, iterations, key length 
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex'); 
};

UserSchema.methods.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex'); 
    return this.hash === hash; 
};

UserSchema.methods.generateJWT = function() {
    // expiration 60 days 
    var today = new Date(); 
    var exp = new Date(today); 
    exp.setDate(today.getDate() + 60); 

    // TODO: use an environment variable for referencing the secret
    return jwt.sign({
        _id: this._id, 
        username: this.username, 
        exp: parseInt(exp.getTime() / 1000),
    }, 'SECRET');

};

UserSchema.methods.addCategory = function(category, cb) {
    this.categoies.push(category); 
    this.save(callBack);
};

var User = mongoose.model('User', UserSchema); 

// User.remove({}, function(){});
// User.find({}, function(err, users) {
//     // console.log(users); 
//     for (var user in users) {
//         console.log(users[user].username);
//         // user.remove(function() {});
//     }
// })

