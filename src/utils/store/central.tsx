import type { Api } from "@jellyfin/sdk";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import React, { type ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { type StoreApi, createStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { version } from "../../../package.json";
import {
	type ServerInfo,
	getAllServers,
	getDefaultServer,
	getServer,
} from "../storage/servers";
import { getUser } from "../storage/user";

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
	resetCurrentUser: () => void;
};

/**
 * Sets app inital route
 * @deprecated
 */
export const setInitialRoute = () => {
	// useCentralStore.setState((state) => ({ ...state, initialRoute: route }));
};

/**
 * @deprecated
 */
export const setAppReady = () => {
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
				if (api?.accessToken) {
					const user = (await getUserApi(api).getCurrentUser()).data;
					set((s) => ({ ...s, currentUser: user }));
				}
			},
			resetCurrentUser: () => {
				set((s) => ({ ...s, currentUser: null }));
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
	return useStoreWithEqualityFn(store, selector!, shallow);
}