var express = require('express');
var router = express.Router();
var passport = require ('passport'); 
var jwt = require('express-jwt'); 

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User'); 

// TODO: use an environment variable for secret; use the same secret as the one in models/User.js
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});



// view all posts - GET /posts 
router.get('/posts', function(req, res, next) {
  // returns an array of posts 
  Post.find(function(err, posts){
    if(err){ return next(err); }
    res.json(posts);
  });
});

// return all posts in this category 
router.get('/posts/category/:categories', function(req, res, next) {
  // returns an array of posts 

  userCategories = req.params.categories.split('|');

  console.log("getting all posts in categories: " + userCategories); 

  Post.find({ categories: { $in : userCategories } }, function(err, posts){
    if(err){ return next(err); }
    res.json(posts);
  });

});

// add a new post - POST /posts 
router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username; 

  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

// for preloading post objects 
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

// view comments associated with a post - GET /posts/:id 
router.get('/posts/:post', function(req, res) {
    req.post.populate('comments', function(err, post) {
        if (err) { return next(err); }
        res.json(req.post);
    }); 
});

// upvote a post - PUT /posts/:id/upvote 
router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

// add a comment to post by ID - POST /posts/:id/comments 
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username; 

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});

// preloading comment objects 
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});

// upvote a comment - PUT /posts/:id/comments/:id/upvote
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(comment);
  });
});

// create a new user
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();
  user.username = req.body.username;
  user.setPassword(req.body.password);

  for (var category in req.body.categories) {
    if (req.body.categories[category]) user.categories.push(category); 
  }
    
  console.log("index.js req.body:", req.body); 

  user.save(function (err){
    if(err){ return next(err); }
    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next) {
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }


  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);

});

router.get('/users', function(req, res, next) {
  User.find(function(err, users){
    if(err){ return next(err); }

    res.json(users);
  });
});


router.param('user', function(req, res, next, username) {
  var query = User.findOne({ 'username' : username }); 

  query.exec(function (err, user){
    if (err) { return next(err); }
    if (!user) { return next(new Error('can\'t find user')); }

    req.user = user; 
    return next();
  });
});

router.get('/users/:user', function(req, res) {
  res.json(req.user);
});

router.get('/users/:user/categories', function(req, res, next) {
  User.findOne({ 'username' : req.user.username }, function(err, user) {
    res.json(user.categories); 
  });
}); 

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
 