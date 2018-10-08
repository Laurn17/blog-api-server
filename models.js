"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

var authorSchema = mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	userName: {
		type: 'string',
		unique: true
	}
});

var commentSchema = mongoose.Schema({ content: 'string' });

const blogPostSchema = mongoose.Schema({
	title: {type: String, required: true},
	content: {type: String, required: true},
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
	created: {type: Date, default: Date.now()},
	comments: [commentSchema]
});

blogPostSchema.pre('find', function(next) {
  this.populate('author');
  next();
});

blogPostSchema.pre('findOne', function(next) {
  this.populate('author');
  next();
});

// THIS IS TARGETING AUTHOR WRONG
blogPostSchema.virtual("fullName").get(function() {
	return `${this.author.firstName} ${this.author.lastName}`.trim();
});

// authorSchema.virtual("fullname").get(function() {
// 	return `${this.firstName} ${this.lastName}`.trim();
// }


blogPostSchema.methods.serialize = function() {
	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.fullName, 
		comments: this.comments
	};
};

var Author = mongoose.model("Author", authorSchema, "authors");
const BlogPost = mongoose.model("Blogs", blogPostSchema);


module.exports = {BlogPost, Author};