import type { RecommendedServerInfo } from "@jellyfin/sdk";
import { Store } from "tauri-plugin-store-api";

export interface ServerInfo extends RecommendedServerInfo {
	id: string;
}

export interface ServerStore {
	defaultServer: string | null;
	servers: ServerInfo[];
}

const store = new Store(".servers.dat");

/**
 * Set server in .servers.dat
 */
export const setServer = async (serverId: string, serverInfo: ServerInfo) => {
	const servers = await getAllServers();
	const newServers = servers.filter((server) => server.id !== serverId);

	newServers.push({
		...serverInfo,
		id: serverId,
	});

	await store.set("servers", newServers);
	await store.save();
};

/**
 * Set default server
 */
export const setDefaultServer = async (
	serverId: ServerStore["defaultServer"],
) => {
	await store.set("defaultServer", serverId);
	await store.save();
};

/**
 * Get a Server
 */
export const getServer = async (serverId: string | null) => {
	const servers = await getAllServers();

	return servers.find((server) => server.id === serverId);
};

/**
 * Get all Servers
 */
export const getAllServers = async () => {
	const servers = (await store.get<ServerStore["servers"]>("servers")) || [];

	return servers;
};

/**
 * Get default server
 */
export const getDefaultServer = () => {
	return store.get<ServerStore["defaultServer"]>("defaultServer");
};

/**
 * Delete the given server from client storage
 */
export const delServer = async (serverId: string) => {
	const servers = await getAllServers();

	const newServers = servers.filter((server) => server.id !== serverId);

	await store.set("servers", newServers);
	await store.save();
};

/**
 * Delete the all servers from client storage
 */
export const delAllServer = async () => {
	await store.clear();
	// remove the default server
	await setDefaultServer(null);
	await store.save();
};
