"use strict"

const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { Blog } = require("./models");

const app = express();
app.use(express.json());















let server;

function runSever (databaseUrl, port = PORT) {
	return new Promise(function(resolve, reject) {
		mongoose.connect(
			databaseURL,
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