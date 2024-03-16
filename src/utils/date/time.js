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
 * @return {number} Converted ticks to Seconds
 */
export const ticksToSec = (ticks) => {
	return Math.round(ticksToMs(ticks) / 1000);
};

/**
 * @format
 * @param {number} sec - Sec of a particular item
 * @return {number} Converted Seconds to C# ticks
 */
export const secToTicks = (ticks) => {
	return Math.round(ticks * 10000000);
};

/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} Converted ticks to Hhr Mmin formate
 */
export const getRuntime = (ticks) => {
	const time = ticksToMs(ticks);
	let formatedTime = "";
	let timeSec = Math.floor(time / 1000);
	let timeMin = Math.floor(timeSec / 60);
	timeSec -= timeMin * 60;
	if (timeMin > 60) {
		const timeHr = Math.floor(timeMin / 60);
		timeMin -= timeHr * 60;
		formatedTime = `${timeHr}hr ${timeMin}min`;
	} else {
		formatedTime = `${timeMin}min`;
	}
	return formatedTime;
};

/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} Converted ticks to hh:mm:ss formate
 */
export const getRuntimeMusic = (ticks) => {
	const time = ticksToMs(ticks);
	let formatedTime = "";
	let timeSec = Math.floor(time / 1000);
	let timeMin = Math.floor(timeSec / 60);
	timeSec -= timeMin * 60;
	timeSec = timeSec === 0 ? 0o0 : timeSec;
	if (timeMin > 60) {
		const timeHr = Math.floor(timeMin / 60);
		timeMin -= timeHr * 60;
		formatedTime = `${timeHr}:${timeMin.toLocaleString([], {
			minimumIntegerDigits: 2,
			useGrouping: false,
		})}:${timeSec.toLocaleString([], {
			minimumIntegerDigits: 2,
			useGrouping: false,
		})}`;
	} else {
		formatedTime = `${timeMin}:${timeSec.toLocaleString([], {
			minimumIntegerDigits: 2,
			useGrouping: false,
		})}`;
	}
	return formatedTime;
};

/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} Converted ticks to H hour M minutes formate
 */
export const getRuntimeFull = (ticks) => {
	const time = ticksToMs(ticks);
	let formatedTime = "";
	let timeSec = Math.floor(time / 1000);
	let timeMin = Math.floor(timeSec / 60);
	timeSec -= timeMin * 60;
	if (timeMin > 60) {
		const timeHr = Math.floor(timeMin / 60);
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
 * @return {number} Converted ticks to Hh Mm formate
 */
export const getRuntimeCompact = (ticks) => {
	const time = ticksToMs(ticks);
	let formatedTime = "";
	let timeSec = Math.floor(time / 1000);
	let timeMin = Math.floor(timeSec / 60);
	timeSec -= timeMin * 60;
	if (timeMin > 60) {
		const timeHr = Math.floor(timeMin / 60);
		timeMin -= timeHr * 60;
		formatedTime = `${timeHr}h ${timeMin}m`;
	} else {
		formatedTime = `${timeMin}m`;
	}
	return formatedTime;
};

/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} End time of an item
 */
export const endsAt = (ticks) => {
	const current = new Date();
	const currentTime = current.getTime();
	const time = ticksToMs(ticks);
	const calculatedTime = currentTime + time;
	const formated = new Date(calculatedTime).toLocaleString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
	// let formated = `${hr - 12}:${min}`;
	// return `Ends at ${formated.getHours()}:${formated.getMinutes()}`;
	return `Ends at ${formated}`;
};
