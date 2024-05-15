import { create } from "zustand";
import { version } from "../../../package.json";
import { getAllServers, getDefaultServer, getServer } from "../storage/servers";
import { getUser } from "../storage/user";
/**
 * Central Store controls the base state required by the app
 */
export const useCentralStore = create(() => ({
	defaultServerOnDisk: async () => await getDefaultServer(),
	defaultServerInfoOnDisk: async () => {
		const a = await getDefaultServer();
		return await getServer(a);
	},
	allServersOnDisk: async () => await getAllServers(),
	userOnDisk: async () => await getUser(),
	/** This is the initial route that app goes to just after app startups */
	initialRoute: null,
	clientVersion: version,
	appReady: false,
}));

/**
 * Sets app inital route
 * @param {string} route
 */
export const setInitialRoute = (route) => {
	useCentralStore.setState((state) => ({ ...state, initialRoute: route }));
};

export const setAppReady = (appReady) => {
	useCentralStore.setState((state) => ({ ...state, appReady }));
};