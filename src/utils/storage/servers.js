/** @format */

import { Store } from "tauri-plugin-store-api";

const servers = new Store(".servers.dat");

/**
 * Set server in .servers.dat
 * @param {string} serverId
 * @param {object} serverInfo
 */
export const setServer = async (serverId, serverInfo) => {
	servers.set(serverId, serverInfo);
	await servers.save();
};

/**
 * Set default server
 * @param {string} serverId
 */
export const setDefaultServer = async (serverId) => {
	servers.set("defaultServer", serverId);
	await servers.save();
};

/**
 * Get a Server
 * @returns {object} server
 */
export const getServer = async (serverId) => {
	let server = await servers.get(serverId);
	return server;
};

/**
 * Get all Servers
 */
export const getAllServer = async () => {
	let server = await servers.entries();
	// remove default server field from this result
	server = server.filter((item) => item[0] != "defaultServer");
	return server;
};

/**
 * Get default server
 */
export const getDefaultServer = async () => {
	let server = await servers.get("defaultServer");
	return server;
};

/**
 * Delete the given server from client storage
 * @param {string} serverId
 */
export const delServer = async (serverId) => {
	await servers.delete(serverId);
	await servers.save();
};

/**
 * Delete the all servers from client storage
 */
export const delAllServer = async () => {
	await servers.clear();
	// remove the default server
	await setDefaultServer(null);
	await servers.save();
};
