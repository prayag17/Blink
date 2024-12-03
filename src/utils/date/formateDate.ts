/**
 * @format
 * @param {string} date - Date from server
 * @returns {string} Formated Date
 */

export const formateDate = (date: string | number | Date) => {
	const dateObj = new Date(date);
	const formatedDate = new Intl.DateTimeFormat().format(dateObj);
	return formatedDate;
};
