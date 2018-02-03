const express = require('express');
const bodyParser = require('body-parser');
const pjson = require('./package.json')
const moment = require('moment');
const app = express();
var request = require('request');

var request = request.defaults({jar: true});
var mhsToken = null;

app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('This server is running ' + pjson.name +  ' version ' + pjson.version + ".");
})

app.post('/myTiger', function (req, res) {
	const intent = req.body.result.metadata.intentName;
	var displayText = null;
	var reply = null;

	if (intent === "lunch") {
		var date = req.body.result.parameters.date.split("-");
		if(req.body.result.parameters.date === "") {
			date = moment();
			date = date.format('YYYY-MM-DD')
			date = date.split("-");
		}
		const year = date[0].split("20")[1]; 
		const month = date[1]; 
		const day = date[2];
		const url = 'http://206.82.192.168/v2/menu/' + month + '/' + day + '/' + year + '/app/bigdalton?key=3D895734-2271-4563-8332-AB943B2E9CAF&siteID=538277448587fc0fd60006fd';
		request(url, function (error, response, body) {
			body = body.replace("menu items", "menu_items");
			body = body.replace("meal periods", "meal_periods");
			if (JSON.parse(body).meal_periods[0] === undefined) {
				reply = "It doesn't seem like there's lunch that day."
				displayText = reply;
			} else {
				lunch = JSON.parse(body).meal_periods[0].menu_items;
				records = JSON.parse(body).records;   
				if(lunch[0] === undefined) {
					reply = "It doesn't seem like there's lunch that day."
					displayText = reply;
				} else {
					if(records === 0){
						reply = "I can't give you information about lunch when there is no school."
						displayText = reply;
					} else {
						reply = "Lunch is " + lunch[0].name;
						for(var i = 1; i < 4; i++){
							reply += ", ";
							if(i == 3) {
								reply += "and "
							}
							reply += lunch[i].name;
						}
						displayText =  "Lunch is " + lunch[0].name;
						for(var i = 1; i < lunch.length; i++){
							displayText += ", ";
							if(i == lunch.length - 1) {
								displayText += "and "
							}
							displayText += lunch[i].name;
						}
					}
				}
			}
			res.json({ "speech": reply + "Is there anything else I can help with?", "displayText": displayText + "Is there anything else I can help with?"})
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
		console.log(fridayRequestURL);
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
			res.json({ "speech": reply, "displayText": reply });
		})
	} else if (intent === "metadata") {
		reply = "Hi! I'm Dalton MyTiger Server Version " + pjson.version + ".";
		res.json({ "speech": reply + "Is there anything else I can help with?", "displayText": reply + "Is there anything else I can help with?" });
	}
})

app.listen(3000, function () {
	console.log('MyTiger verison ' + pjson.version + ' listening on port 3000!')
	request('https://api-v2.myhomework.space/auth/csrf', function (error, response, body) {
		body = JSON.parse(body);
		mhsToken = body.token;
		console.log("Got MyHomeworkSpace CSRF token!")
		console.log(mhsToken);
	})
})