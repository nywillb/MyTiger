var request = require("request");

module.exports = {
	getLunchForDate: function(date, callback) {
		const year = date.year() - 2000;
		const month = ((date.month() + 1) < 10 ? "0" : "") + (date.month() + 1);
		const day = (date.date() < 10 ? "0" : "") + date.date();

		const url = 'http://206.82.192.168/v2/menu/' + month + '/' + day + '/' + year + '/app/bigdalton?key=3D895734-2271-4563-8332-AB943B2E9CAF&siteID=538277448587fc0fd60006fd';

		request(url, function(error, response, body) {
			if(error) {
				console.error(error);
			} else if (body != undefined) {
				var bodyObject = JSON.parse(body);
				if (bodyObject["meal periods"][0] && bodyObject["records"] != 0) {
					var mealPeriod = bodyObject["meal periods"][0];
					var menuItems = mealPeriod["menu items"];
					if (menuItems && menuItems.length > 0) {
						callback(menuItems);
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			} else {
				callback(undefined)
			}
		});
	}
};