/** @format */

import { Store } from "tauri-plugin-store-api";

const user = new Store(".user.dat");

/**
 * Set User details to .user.dat
 * @param {string} userName - User's name
 * @param {string} userPassword - User's Password
 */
const saveUser = (userName, userPassword) => {
	let details = user.set("user", {
		Name: userName,
		Password: userPassword,
	});
};

/**
 * Get saved user fro .user.dat
 * @return {object}
 */
const getUser = async () => {
	let details = await user.get("user");
	return details;
};

export { saveUser, getUser };
