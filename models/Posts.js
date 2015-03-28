var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  link: String,
  author: String, 
  description: String, 
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  categoies: [String]
});

PostSchema.methods.upvote = function(callBack) {
  this.upvotes += 1;
  this.save(callBack);
};

PostSchema.methods.addCategory = function(category, callBack) {
    this.categoies.push(category); 
    this.save(callBack);
}

mongoose.model('Post', PostSchema);

