const express = require('express');
const bodyParser = require('body-parser');
const pjson = require('./package.json')
const moment = require('moment');
const app = express();

var lunch = require("./lunch");

var request = require('request');

var request = request.defaults({jar: true});
var mhsToken = null;

app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('This server is running ' + pjson.name +  ' version ' + pjson.version + ".");
})

app.get('/data', function (req, res) {
	let response = [];
	lunch.getLunchForDate(moment(), (lunch) => {
		console.log("LUNCH SUCCESS")
		let lunchCard = {};
		lunchCard.icon = "pizza";
		lunchCard.name = "Lunch Menu"
		if(lunch == null) {
			lunchCard.type = "sentence"
			lunchCard.data = "There's no lunch today."
		} else if(lunch == undefined) {
			lunchCard.type = "sentence"
			lunchCard.data = "We're having trouble contacting the lunch menu server."
		} else {
			lunchCard.type = "list";
			lunchCard.data = lunch;
		}
		if(response.length == 2) { res.json(response) }
	});
	const friday = moment().day("Friday")
	const fridayToday = (moment().format("YYYY-MM-DD") == friday.format("YYYY-MM-DD"));
	const fridayRequestURL = 'https://api-v2.myhomework.space/planner/fridays/get/' + moment().day("Friday").format("YYYY-MM-DD") + '?csrfToken=' + mhsToken
	request(fridayRequestURL, (error, resp, body) => {
		console.log("FRIDAY SUCCESS")
		let fridayCard = {};
		fridayCard.icon = "calendar";
		fridayCard.name = "Friday"
		fridayCard.type = "sentence"
		body = JSON.parse(body);
		if(error || body.friday == undefined) {
			fridayCard.data = "There was an error fetching the friday."
		} else if (body.friday.index == -1 ) {
			fridayCard.data = "This week's friday doesn't follow a regular schedule"
		} else {
			fridayCard.data = `${fridayToday ? "Today" : "This week's Friday" } is a Friday ${body.friday.index}.`
		}
		if(response.length == 2) { res.json(response) }
	});
})

app.post('/myTiger', function (req, res) {
	const intent = req.body.result.metadata.intentName;
	var displayText = null;
	var reply = null;

	if (intent === "lunch") {
		var date = moment();
		if (req.body.result.parameters.date) {
			date = moment(req.body.result.parameters.date, "YYYY-MM-DD");
		}

		lunch.getLunchForDate(date, function(lunch) {
			var reply = "";
			var displayText = "";
			if (lunch != (null || undefined)) {
				displayText = reply = "Lunch is: ";
				for (var i = 0; i < lunch.length; i++) {
					var itemName = lunch[i].name;

					if (i > 0) {
						displayText += ", ";
					}
					if (i == (lunch.length - 1)) {
						displayText += "and ";
					}
					displayText += itemName;

					if (i < 3) {
						if (i > 0) {
							reply += ", ";
						}
						if (i == 2) {
							reply += "and ";
						}
						reply += itemName;
					}
				}
				displayText += ".";
				reply += ".";
			} else if (lunch == null) {
				displayText = reply = "It doesn't seem like there's lunch that day.";
			} else if (lunch == undefined) {
				displayText = reply = "We're having some issues contacting the server "
			}

			res.json({
				speech: reply + " Is there anything else I can help with?",
				displayText: displayText + " Is there anything else I can help with?"
			});
		});
	} else if (intent === "friday") {
		var date = req.body.result.parameters.date;
		if(date === "today" || date == null || date === "") {
			var startDate = moment();
		} else {
			var startDate = moment(date); //TODO: Fix date formatting
		}	
		var fridayDate = startDate.day("Friday");
		var fridayRequestURL = 'https://api-v2.myhomework.space/planner/fridays/get/' + fridayDate.format("YYYY-MM-DD") + '?csrfToken=' + mhsToken
		request(fridayRequestURL, function (error, response, body) {
			body = JSON.parse(body);
			if(body.friday != undefined) {
				friday = body.friday.index;
				if(friday === -1) {
					reply = "That friday does not follow a regular schedule.";
				} else {
					reply = fridayDate.format('dddd, MMMM Do YYYY') + " is a Friday " + friday + ".";
				}
			} else reply = "The date specified doesn't seem to be a friday.";
			res.json({ "speech": reply + " Is there anything else I can help you with?", "displayText": reply + " Is there anything else I can help you with?"});
		})
	} else if (intent === "metadata") {
		reply = "Hi! I'm Dalton MyTiger Server Version " + pjson.version + ".";
		res.json({ "speech": reply + " Is there anything else I can help with?", "displayText": reply + " Is there anything else I can help with?" });
	}
})

app.listen(process.env.PORT || 3000, function () {
	console.log('MyTiger version ' + pjson.version + ' listening on port ' + (process.env.PORT || 3000) + '!')
	request('https://api-v2.myhomework.space/auth/csrf', function (error, response, body) {
		body = JSON.parse(body);
		mhsToken = body.token;
		console.log("Got MyHomeworkSpace CSRF token!")
		console.log(mhsToken);
	})
})
