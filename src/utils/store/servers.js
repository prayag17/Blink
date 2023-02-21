/** @format */

import { Store } from "tauri-plugin-store-api";

const servers = new Store(".servers.dat");

/**
 * Set server in .servers.dat
 * @param {object} data - Server info
 */
const setServer = async (data) => {
	let server = servers.set("server", data);
};

/**
 * Get Server list
 * @returns {object}
 */
const getServer = async () => {
	let server = servers.get("server");
	return server;
};
export { setServer, getServer };
