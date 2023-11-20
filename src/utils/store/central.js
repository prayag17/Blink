/** @format */

import { create } from "zustand";
import { getAllServer, getDefaultServer, getServer } from "../storage/servers";
import { getUser } from "../storage/user";

/**
 * Central Store controls the base state required by the app
 */
export const useCentralStore = create(() => ({
	defaultServerOnDisk: async () => await getDefaultServer(),
	defaultServerInfoOnDisk: async () => {
		let a = await getDefaultServer();
		return await getServer(a);
	},
	allServersOnDisk: async () => getAllServer(),
	userOnDisk: async () => getUser(),
	/** This is the initial route that app goes to just after app startups */
	initialRoute: null,
}));

/**
 * Sets app inital route
 * @param {string} route
 */
export const setInitialRoute = (route) => {
	useCentralStore.setState((state) => ({ ...state, initialRoute: route }));
};
