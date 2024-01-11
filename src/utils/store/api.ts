import { Api, Jellyfin } from "@jellyfin/sdk";
import { create } from "zustand";
import { version as appVer } from "../../../package.json";

// Initial custom axios client to use tauri's http module
import axios from "axios";
import axiosTauriApiAdapter from "axios-tauri-api-adapter";

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

const jellyfin = new Jellyfin({
	clientInfo: {
		name: "JellyPlayer",
		version: appVer,
	},
	deviceInfo: {
		name: "JellyPlayer",
		id: deviceId,
	},
});

export const useApi = create<{
	api: Api | null;
	deviceId: string | null;
	jellyfin: Jellyfin;
}>(() => ({
	api: null,
	deviceId: deviceId,
	jellyfin: jellyfin,
}));

export const createApi = (
	serverAddress: string,
	accessToken: string | undefined,
) =>
	useApi.setState((state) => ({
		...state,
		api: jellyfin.createApi(serverAddress, accessToken, axiosClient),
	}));
