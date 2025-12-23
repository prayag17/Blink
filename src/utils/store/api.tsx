import { type Api, Jellyfin } from "@jellyfin/sdk";
import React, { type ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { type StoreApi, createStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { version as appVer } from "../../../package.json";
import { getDefaultServer, getServer } from "../storage/servers";
import { getUser } from "../storage/user";

// Initial custom axios client to use tauri's http module
import axios from "axios";

type ApiStore = {
	api: Api | undefined;
	deviceId: string | null;
	jellyfin: Jellyfin;
	createApi: (serverAddress: string, accessToken?: string | undefined) => void;
};

/**
 * @deprecated
 */
export const axiosClient = axios.create({
	// adapter: axiosTauriApiAdapter,
	headers: {
		"Access-Control-Allow-Origin": "*",
	},
	timeout: 60000,
});

const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();

if (!localStorage.getItem("deviceId")) {
	localStorage.setItem("deviceId", deviceId);
}

export const jellyfin = new Jellyfin({
	clientInfo: {
		name: "Blink",
		version: appVer,
	},
	deviceInfo: {
		name: "Blink",
		id: deviceId,
	},
});

export const initializeApi = async () => {
	const currentServerId = await getDefaultServer();
	if (currentServerId) {
		const currentServer = await getServer(currentServerId);
		if (currentServer?.address) {
			const userOnDisk = await getUser();
			if (userOnDisk) {
				return jellyfin.createApi(
					currentServer.address,
					userOnDisk.AccessToken,
				);
			}
			return jellyfin.createApi(currentServer.address);
		}
	}
	return undefined;
};

export const ApiContext = createContext<StoreApi<ApiStore>>(undefined!);

export const ApiProvider = ({
	children,
	initialApi,
}: { children: ReactNode; initialApi?: Api }) => {
	const [store] = useState(() =>
		createStore<ApiStore>()((set) => ({
			api: initialApi,
			deviceId: deviceId,
			jellyfin: jellyfin,
			createApi: (serverAddress, accessToken?) =>
				set((state) => {
					const apiTemp = state.jellyfin.createApi(serverAddress, accessToken);
					return {
						...state,
						api: apiTemp,
					};
				}),
		})),
	);
	return <ApiContext.Provider value={store}>{children}</ApiContext.Provider>;
};

export function useApiInContext<T>(selector?: (state: ApiStore) => T) {
	const store = useContext(ApiContext);
	if (!store) {
		throw new Error("Missing ApiProvider");
	}
	return useStoreWithEqualityFn(store, selector!, shallow);
}