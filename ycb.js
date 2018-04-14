const moment = require("moment");
const request = require("request");
const { JSDOM } = require("jsdom");

var parseSlotsPage = function(page) {
	var days = [];

	var gridDays = page.window.document.querySelectorAll(".gridDay");
	gridDays.forEach(function(gridDay) {
		var daySlots = [];

		var dateString = gridDay.querySelector(".gridHeader .gridHeaderDate").dataset.content;
		var date = moment(dateString, "M/D/YY");
		var gridSlots = gridDay.querySelectorAll(".gridSlot");

		gridSlots.forEach(function(gridSlot) {
			var epochTime = parseInt(gridSlot.id.replace("grid", ""));
			var momentTime = moment(epochTime);
			var isFree = (gridSlot.classList.contains("gridFree"));
			
			var bookUrl = null;
			if (isFree) {
				bookUrl = gridSlot.querySelector("a").href;
			}

			daySlots.push({
				time: momentTime,
				isFree: isFree,
				bookUrl: bookUrl
			});
		});

		days.push({
			date: date,
			slots: daySlots
		});
	});

	return days;
};

var getSlots = function(name, callback) {
	request("https://" + name + ".youcanbook.me", function(error, response, body) {
		var page = new JSDOM(body);

		if (page.window.document.querySelector("frame")) {
			// it's a weird page with a frame to a classic.youcanbook.me page, follow that to get the slots
			var url = page.window.document.querySelector("frame").src;
			request(url, function(error, response, body) {
				var cleanBody = body;

				// hacky workaround to remove weird css styling that jsdom chokes on
				cleanBody = cleanBody.replace(new RegExp("<style type=\"text\\/css\">([^]*)<\\/style>", "g"), "");

				callback(parseSlotsPage(new JSDOM(cleanBody)));
			});
		} else {
			callback(parseSlotsPage(page));
		}
	});
};

module.exports = {
	getSlots: getSlots
};