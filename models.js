"use strict";

const mongoose = require("mongoose");

const blogPostSchema = mongoose.Schema({
	title: {type: String, required: true},
	content: {type: String, required: true},
	author: [{
		firstName: {type: String, required: true},
		lastName: {type: String, required: true}
	}],
	created: Date
});

blogPostSchema.virtual("fullName").get(function() {
	return `${this.author.firstName} ${this.author.lastName}`;
});

blogPostSchema.methods.serialize = function() {
	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.fullName,
		created: Date.now()
	};
};

const BlogPost = mongoose.model("Blogs", blogPostSchema);

module.exports = {BlogPost};