//this app requires the use of your own config.js file in the root folder
"use strict";
//globals and definitions
const express = require("express");
const bodyParser = require("body-parser");
const Twitter = require("./src/twitter");
const app = express();
//setup bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
//setup pug
app.use("/static", express.static(__dirname + "/src/public"));
app.set("view engine", "pug");
app.set("views", __dirname + "/src/templates");
//GET request; set root view through function call
app.get("/", function (req, res, next) {
	const model = {};
	Twitter.collectTwitterData(model, next, function () {
		res.render("index", model);
	});
});
//POST request; set tweet functionality through function call
app.post("/", function (req, res, next) {
	Twitter.sendTweet(req.body.text, next, function () {
		res.location("/");
	});
});
//render error stack if error
app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	res.render("error", {
		message: err.message,
		stack: err.stack
	});
});
//set server on localhost
app.listen(3000, function () {
	console.log("The frontend server is running on port 3000!");
});
