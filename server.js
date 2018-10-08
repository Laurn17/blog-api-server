"use strict"

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { BlogPost, Author } = require("./models");

const app = express();

app.use(express.json());
app.use(morgan("common"));

// GET ALL AUTHORS
app.get("/authors", (req, res) => {
	Author.find()
		.then(function(authors) {
			res.json(
				authors.map(author => {
					return {
						id: author._id,
						name: `${author.firstName} ${author.lastName}`,
						userName: author.userName
					};
				}));
			})
		.catch(function(err) {
			console.error(err);
			res.status(500).json({message: "Internal server error"});
		});
});

// GET ALL BLOGS
app.get("/blogs", (req, res) => {
	BlogPost.find()
		.populate('author')
		.then(function(blogs) {
			res.json({
				blogs: blogs.map(blogs => blogs.serialize())
			});
		})
		.catch(function(err) {
			console.error(err);
			res.status(500).json({message: "Internal server error"});
		});
});

// GET A BLOG POST BY ID
app.get("/blogs/:id", (req, res) => {
	BlogPost.findById(req.params.id)
		.populate('author')
		.then(function(blogs) {
			res.json(blogs.serialize())
		})
		.catch(function(err) {
			console.error(err);
			res.status(500).json({message: "Internal server error"});
		});
});

// CREATE AN AUTHOR
app.post("/authors", (req, res) => {
	const requiredFields = ["firstName", "lastName", "userName"];
	for (let i = 0; i < requiredFields.length; i++) {
		const field =requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}
	Author
		.findOne({
			userName: req.body.userName
		})
		.then(function(author) {
			if (author) {
				const message = `Username already exists`
				console.error(message);
				return res.status(400).send(message);
			}
			else {
				Author.create({
					firstName: req.body.firstName,
					lastName: req.body.lastName,
					userName: req.body.userName
				})
				.then(function(author) {
					res.status(201).json({
						_id: author.id,
						name: `${author.firstName} ${author.lastName}`,
						userName: author.userName
					})
				})
				.catch(function(err) {
					console.error(err);
					res.status(500).json({message: "Internal server error"})
				});
			};
		});
});

// CREATE A BLOG POST
app.post("/blogs", (req, res) => {
	const requiredFields = ["title", "content", "author_id"];
	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}

	BlogPost.create({
		title: req.body.title,
		content: req.body.content,
		author: req.body.author,
		created: Date.now()
	})
	.populate("author")
	.then(function(blog) {
		res.status(201).json(blog.serialize())
	})
	.catch(function(err) {
		console.error(err);
		res.status(500).json({message: "Internal server error"});
	});
});

// UPDATE AN AUTHOR
app.put("/authors/:id", (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    	return res.status(400).json("ids do not match!");
	}
	const toUpdate = {};
	const updatebleFields = ["firstName", "lastName", "userName"];

	updatebleFields.forEach(function(field) {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	 Author
    	.findOne({ userName: toUpdate.userName || '', _id: { $ne: req.params.id } })
    	.then(author => {
      		if (author) {
        	const message = `Username already taken`;
        	console.error(message);
        	return res.status(400).send(message);
      		}


			else {
			Author
			.findByIdAndUpdate(req.params.id, { $set: toUpdate}, {new: true})
			.then(author => {
				res.status(200).json({
					id: author.id,
					name: `${author.firstName} ${author.lastName}`,
					userName: author.userName
				});
			})
			.catch(function(err) { 
				res.status(500).json({message: err});
			});
		}
	});
});

// UPDATE A BLOG POST
app.put("/blogs/:id", (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message =
      	`Request path id (${req.params.id}) and request body id ` +
      	`(${req.body.id}) must match`;
    	console.error(message);
    	return res.status(400).json({ message: message });
	}
	const toUpdate = {};
	const updatebleFields = ["title", "content"];

	updatebleFields.forEach(function(field) {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	BlogPost
		.findByIdAndUpdate(req.params.id, { $set: toUpdate}, {new: true})
		.then(function(blog) {
			res.status(200).json(blog.serialize())
		})
		.catch(function(err) {
			res.status(500).json({message: "Internal Server Error"})
		});
});

// DELETE AN AUTHOR
app.delete('/authors/:id', (req, res) => {
  BlogPost
    .remove({ author: req.params.id })
    .then(() => {
      Author
        .findByIdAndRemove(req.params.id)
        .then(() => {
          console.log(`Deleted blog posts owned by and author with id \`${req.params.id}\``);
          res.status(204).json({ message: 'success' });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Internal server error?" });
    });
});

// DELETE A BLOG POST
app.delete("/blogs/:id", (req, res) => {
	BlogPost
		.findByIdAndRemove(req.params.id)
		.then(function(blog) {
			res.status(204).end();
		})
		.catch(function(err) {
			console.error(err);
			res.status(500).json({message: "Internal server error"})
		});
});








let server;

function runServer (databaseUrl, port = PORT) {
	return new Promise((resolve, reject) => {
		mongoose.connect(
			databaseUrl,
			err => {
				if (err) {
					return reject(err);
				}
				server = app
					.listen(port, () => {
						console.log(`Your app is listening on ${port}`);
						resolve();
					})
					.on("error", err => {
						mongoose.disconnect();
						reject(err);
					});
				});
	});
}

function closeServer() {
	return mongoose.disconnect().then(() => {
		return new Promies((resolve, reject) => {
			console.log("CLosing server");
			server.close(err => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	});
}

if (require.main === module) {
	runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = {runServer, app, closeServer};