var ycb = require("./ycb");

ycb.getSlots("labtester", function(slots) {
	slots.forEach(function(day) {
		console.log(day.date.format("YYYY-MM-DD"));
		day.slots.forEach(function(slot) {
			console.log("\t" + slot.time.format("h:mm a") + (slot.isFree ? " (free)" : " (busy)"));
		});
	});
});