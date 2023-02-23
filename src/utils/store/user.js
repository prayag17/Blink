/** @format */

import { Store } from "tauri-plugin-store-api";

const user = new Store(".user.dat");

/**
 * Set User details to .user.dat
 * @param {string} userName - User's name
 * @param {string} userPassword - User's Password
 */
const saveUser = (userName, userPassword) => {
	let details = user.set("details", {
		Name: userName,
		Password: userPassword,
	});
};

export { saveUser };
