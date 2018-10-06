"use strict"

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { BlogPost } = require("./models");

const app = express();

app.use(express.json());
app.use(morgan("common"));


app.get("/blogs", (req, res) => {
	BlogPost.find()
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

app.get("/blogs/:id", (req, res) => {
	BlogPost.findById(req.params.id)
		.then(function(blogs) {
			res.json(blogs.serialize())
		})
		.catch(function(err) {
			console.error(err);
			res.status(500).json({message: "Internal server error"});
		});
});

app.post("/blogs", (req, res) => {
	const requiredFields = ["title", "content", "author"];
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
	.then(function(blog) {
		res.status(201).json(blog.serialize())
	})
	.catch(function(err) {
		console.error(err);
		res.status(500).json({message: "Internal server error"});
	});
});

app.put("/blogs/:id", (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message =
      	`Request path id (${req.params.id}) and request body id ` +
      	`(${req.body.id}) must match`;
    	console.error(message);
    	return res.status(400).json({ message: message });
	}
	const toUpdate = {};
	const updatebleFields = ["title", "content", "author"];

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

app.delete("/blogs/:id", (req, res) => {
	BlogPost
		.findByIdAndRemove(req.params.id)
		.then(function(blog) {
			res.status(204).end();
		})
		.catch(function(err) {
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