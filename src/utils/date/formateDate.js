/**
 * @format
 * @param {string} date - Date from server
 * @returns {string} Formated Date
 */

export const formateDate = (date) => {
	let date = new Date(date);
	date = new Intl.DateTimeFormat().format(date);
	return date;
};
