import { type Api, Jellyfin } from "@jellyfin/sdk";
import React, { createContext, useContext, useRef, useState } from "react";
import { type StoreApi, createStore, useStore } from "zustand";
import { version as appVer } from "../../../package.json";

// Initial custom axios client to use tauri's http module
import axios from "axios";
import axiosTauriApiAdapter from "axios-tauri-api-adapter";

type ApiStore = {
	api: Api;
	deviceId: string | null;
	jellyfin: Jellyfin;
	createApi: (
		serverAddress: string | undefined,
		accessToken?: string | undefined,
	) => void;
};

export const axiosClient = axios.create({
	adapter: axiosTauriApiAdapter,
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
		name: "JellyPlayer",
		version: appVer,
	},
	deviceInfo: {
		name: "JellyPlayer",
		id: deviceId,
	},
});

// export const useApi = create<{
// 	api: Api;
// 	deviceId: string | null;
// 	jellyfin: Jellyfin;
// }>(() => ({
// 	api: undefined,
// 	deviceId: deviceId,
// 	jellyfin: jellyfin,
// }));

export const ApiContext = createContext(null);

export const ApiProvider = ({ children }) => {
	const [store] = useState(() =>
		createStore<ApiStore>()((set) => ({
			api: undefined,
			deviceId: deviceId,
			jellyfin: jellyfin,
			createApi: (serverAddress, accessToken?) =>
				set((state) => {
					const apiTemp = state.jellyfin.createApi(
						serverAddress,
						accessToken,
						axiosClient,
					);
					console.info(apiTemp);
					return {
						...state,
						api: apiTemp,
					};
				}),
		})),
	)
	return <ApiContext.Provider value={store}>{children}</ApiContext.Provider>;
};

export function useApiInContext<T>(selector?: (state: ApiStore) => T) {
	const store = useContext(ApiContext);
	if (!store) {
		throw new Error("Missing StoreProvider");
	}
	return useStore(store, selector!);
}

export const createApi = (
	serverAddress: string | undefined,
	accessToken: string | undefined,
) => {
	const createApiFn = useApiInContext((s) => s.createApi);
	createApiFn(serverAddress, accessToken);
};
