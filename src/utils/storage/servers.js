/** @format */

import { Store } from "tauri-plugin-store-api";

const servers = new Store(".servers.dat");

/**
 * Set server in .servers.dat
 * @param {object} data - Server info
 */
const setServer = async (data) => {
	let server = servers.set("server", data);
	await servers.save();
};

/**
 * Get Server list
 * @returns {object} server
 */
const getServer = async () => {
	let server = await servers.get("server");
	return server;
};

/**
 * Delete the given server from client storage
 */
const delServer = async () => {
	await servers.delete("server");
	await servers.save();
};

export { setServer, getServer, delServer };
