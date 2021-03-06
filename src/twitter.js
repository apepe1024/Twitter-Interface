"use strict";
//globals and definitions
const config = require("../config");
const Twit = require("twit");
const moment = require('moment');
const Twitter = new Twit(config);
//function to collect all relevant twitter data
function collectTwitterData(object, next, callback) {
	//twit has promise based functionality, thus a promiseList
	const promiseList = new PromiseList();
	promiseList.addPromise(addSettings);
	promiseList.addPromise(addStatuses);
	promiseList.addPromise(addFriends);
	promiseList.addPromise(addMessages);
	Promise.all(promiseList.promises).then(
		function (results) {
			mergeResults(object, results);
			callback();
		}).catch(next);
}
//push promise stack
function PromiseList() {
	this.promises = [];
	this.addPromise = function (func) {
		this.promises.push(new Promise(func));
	};
}
//merge promise stack
function mergeResults(object, results) {
	for (let result of results) {
		Object.assign(object, result);
	}
}
//resolve twitter user settings
function addSettings(resolve, reject) {
	Twitter.get("account/settings", {}, function (err, data) {
		if (err) {
			reject(err);
		}
		const object = {
			screen_name: data.screen_name
		};
		Twitter.get("users/show", {
			screen_name: object.screen_name
		}, function (err, data) {
			object.profile_image = data.profile_image_url_https;
      object.background_image = data.profile_background_image_url_https;
			resolve(object);
		});
	});
}
//resolve user tweets
function addStatuses(resolve, reject) {
	Twitter.get("statuses/user_timeline", {count: 5}, function (err, data) {
		if (err) {
			reject(err);
		}
		const object = {};
		const statuses = [];
		for (let status of data) {
			let statusObject = {}
				statusObject.created_at = moment(status.created_at).format('ddd MMM do, YYYY, h:mm A');
				statusObject.favorite_count = status.favorite_count;
				statusObject.profile_image = status.user.profile_image_url_https;
				statusObject.retweet_count = status.retweet_count;
				statusObject.screen_name = status.user.screen_name;
				statusObject.text = status.text;
				statusObject.username = status.user.name;
				statuses.push(statusObject);
		}
		object.statuses = statuses;
		resolve(object);
	});
}
//resolve user latest follows
function addFriends(resolve, reject) {
	Twitter.get("friends/list", {count: 5}, function (err, data) {
		if (err) {
			reject(err);
		}
		const object = {};
		const friends = [];
		for (let friend of(data.users || [])) {
			const friendObject = {
				name: friend.name,
				profile_image: friend.profile_image_url_https,
				screen_name: friend.screen_name
			};
			friends.push(friendObject);
		}
		object.friends = friends;
		resolve(object);
	});
}
//resolve user latest DMs received
function addMessages(resolve, reject) {
	Twitter.get("direct_messages", {count: 5}, function (err, data) {
		if (err) {
			reject(err);
		}
		const object = {};
		const messages = [];
		for (let message of data) {
			let messageObject = {};
				messageObject.created_at = moment(message.created_at).format('ddd MMM do, YYYY, h:mm A');
				messageObject.profile_image = message.sender.profile_image_url_https;
				messageObject.sender = message.sender.name;
				messageObject.text = message.text;
				messages.push(messageObject);
		}
		object.messages = messages;
		resolve(object);
	});
}
//resolve user tweet functionality
function sendTweet(text, next, callback) {
	if (text.trim().length > 0) {
		Twitter.post("statuses/update", {status: text}, function (err) {
			if (err) {
				next(err);
				return;
			}
			callback();
		});
	} else {
		callback();
	}
}
//module exports for use in app.js
module.exports.collectTwitterData = collectTwitterData;
module.exports.sendTweet = sendTweet;
