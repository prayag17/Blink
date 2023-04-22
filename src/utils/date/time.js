/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} Converted ticks to Milliseconds
 */

const ticksToMs = (ticks) => {
	return Math.round(ticks / 10000);
};

/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} Converted ticks to Hhr Mmin formate
 */
export const getRuntime = (ticks) => {
	let time = ticksToMs(ticks);
	let formatedTime = "";
	let timeSec = Math.round(time / 1000);
	let timeMin = Math.round(timeSec / 60);
	if (timeMin > 60) {
		let timeHr = Math.floor(timeMin / 60);
		timeMin -= timeHr * 60;
		formatedTime = `${timeHr}hr ${timeMin}min`;
	} else {
		formatedTime = `${timeMin}min ${timeSec}sec`;
	}
	return formatedTime;
};

/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} Converted ticks to hh:mm:ss formate
 */
export const getRuntimeMusic = (ticks) => {
	let time = ticksToMs(ticks);
	let formatedTime = "";
	let timeSec = Math.floor(time / 1000);
	let timeMin = Math.floor(timeSec / 60);
	timeSec -= timeMin * 60;
	if (timeMin > 60) {
		let timeHr = Math.floor(timeMin / 60);
		timeMin -= timeHr * 60;
		formatedTime = `${timeHr}:${timeMin}`;
	} else {
		formatedTime = `${timeMin}:${timeSec}`;
	}
	return formatedTime;
};

/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} Converted ticks to H hour M minutes formate
 */
export const getRuntimeFull = (ticks) => {
	let time = ticksToMs(ticks);
	let formatedTime = "";
	let timeSec = Math.floor(time / 1000);
	let timeMin = Math.floor(timeSec / 60);
	timeSec -= timeMin * 60;
	if (timeMin > 60) {
		let timeHr = Math.floor(timeMin / 60);
		timeMin -= timeHr * 60;
		formatedTime = `${timeHr} hour ${timeMin} minutes`;
	} else {
		formatedTime = `${timeMin} minutes`;
	}
	return formatedTime;
};

/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} End time of an item
 */
export const endsAt = (ticks) => {
	let current = new Date();
	let currentTime = current.getTime();
	let time = ticksToMs(ticks);
	let calculatedTime = currentTime + time;
	let formated = new Date(calculatedTime).toLocaleString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
	// let formated = `${hr - 12}:${min}`;
	// return `Ends at ${formated.getHours()}:${formated.getMinutes()}`;
	return `Ends at ${formated}`;
};
