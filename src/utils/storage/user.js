/** @format */

import { Store } from "tauri-plugin-store-api";

const user = new Store(".user.dat");

/**
 * Set User details to .user.dat
 * @param {string} userName - User's name
 * @param {string} userPassword - User's Password
 */
const saveUser = async (userName, userPassword) => {
	let details = user.set("user", {
		Name: userName,
		Password: userPassword || "",
	});
	await user.save();
};

/**
 * Get saved user fro .user.dat
 * @return {object}
 */
const getUser = async () => {
	let details = await user.get("user");
	return details;
};

/**
 * Delete user from storage
 */
const delUser = async () => {
	await user.clear();
};
export { saveUser, getUser, delUser };
