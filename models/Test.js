var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

// var newPost = new Post({
//     title: 'this is title', 
//     link: 'this is link', 
//     upvotes: 1, 
//     comments: []
// });

// newPost.save(function(err, newPost) {
//     if (err) return console.error(err); 
//     console.log("new post saved"); 
// });