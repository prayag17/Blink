/**
 * @format
 * @param {number} ticks - C# ticks of a particular item
 * @return {number} Converted ticks to Milliseconds
 */

const ticksToMs = (ticks) => {
	return Math.round(ticks / 10000);
};

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
		formatedTime = `${timeMin}min`;
	}
	return formatedTime;
};
