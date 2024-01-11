import { Api, Jellyfin } from "@jellyfin/sdk";
import { create } from "zustand";
import { version as appVer } from "../../../package.json";

// Initial custom axios client to use tauri's http module
import axios from "axios";
import axiosTauriApiAdapter from "axios-tauri-api-adapter";
import { v4 as uuidv4 } from "uuid";

export const axiosClient = axios.create({
	adapter: axiosTauriApiAdapter,
	headers: {
		"Access-Control-Allow-Origin": "*",
	},
	timeout: 60000,
});

let deviceId = localStorage.getItem("deviceId");

if (!deviceId) {
	const randomId = uuidv4();
	localStorage.setItem("deviceId", randomId);

	deviceId = randomId;
}

const jellyfin = new Jellyfin({
	clientInfo: {
		name: "JellyPlayer",
		version: appVer,
	},
	deviceInfo: {
		name: "JellyPlayer",
		id: deviceId!,
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
