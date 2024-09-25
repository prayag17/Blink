import React from "react";
import { createStore, StoreApi, useStore } from "zustand";
import { version } from "../../../package.json";
import {
	getAllServers,
	getDefaultServer,
	getServer,
	ServerInfo,
} from "../storage/servers";
import { getUser } from "../storage/user";
import { useApiInContext } from "./api";
import { Api } from "@jellyfin/sdk";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { createContext, useContext, useState } from "react";
import { type UserDto } from "@jellyfin/sdk/lib/generated-client";
import { type ReactNode } from "@tanstack/react-router";

type CentralStore = {
	defaultServerOnDisk: () => Promise<string | null>;
	defaultServerInfoOnDisk: () => Promise<ServerInfo | undefined>;
	allServersOnDisk: () => Promise<ServerInfo[]>;
	userOnDisk: () => Promise<{
		Name: string;
		AccessToken: string;
	} | null>;
	clientVersion: string;
	currentUser: null | UserDto;
	fetchCurrentUser: (api: Api | undefined) => Promise<void>;
};

/**
 * Sets app inital route
 * @deprecated
 */
export const setInitialRoute = (route) => {
	// useCentralStore.setState((state) => ({ ...state, initialRoute: route }));
};

/**
 * @deprecated
 */
export const setAppReady = (appReady) => {
	// useCentralStore.setState((state) => ({ ...state, appReady }));
};

const CentralContext = createContext<StoreApi<CentralStore>>(null!);

export const CentralProvider = ({ children }: { children: ReactNode }) => {
	const [store] = useState(() =>
		createStore<CentralStore>()((set) => ({
			defaultServerOnDisk: async () => await getDefaultServer(),
			defaultServerInfoOnDisk: async () => {
				const a = await getDefaultServer();
				return await getServer(a);
			},
			allServersOnDisk: async () => await getAllServers(),
			userOnDisk: async () => await getUser(),
			clientVersion: version,
			currentUser: null,
			fetchCurrentUser: async (api) => {
				if (api) {
					const user = (await getUserApi(api).getCurrentUser()).data;
					set((s) => ({ ...s, currentUser: user }));
				}
			},
		})),
	);
	return (
		<CentralContext.Provider value={store}>{children}</CentralContext.Provider>
	);
};

export function useCentralStore<T>(selector?: (state: CentralStore) => T) {
	const store = useContext(CentralContext);
	if (!store) {
		throw new Error("Missing CentralProvider");
	}
	return useStore(store, selector!);
}