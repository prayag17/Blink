/** @format */
import { create } from "zustand";
import { Api, Jellyfin } from "@jellyfin/sdk";
import { version as appVer } from "../../../package.json";

// Initial custom axios client to use tauri's http module
import axios from "axios";
import axiosTauriApiAdapter from "axios-tauri-api-adapter";
import { v4 as uuidv4 } from "uuid";

export const axiosClient = axios.create({
	adapter: axiosTauriApiAdapter,
	headers: { "Access-Control-Allow-Origin": "*" },
	timeout: 60000,
});

const deviceId = localStorage.getItem("deviceId");

if (!deviceId) {
	localStorage.setItem("deviceId", uuidv4());
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

/**
 * @typedef {import("@jellyfin/sdk").Api} Api
 */

export const useApi = create(() => ({
	/**
	 * @type {Api}
	 */
	api: null,
	deviceId: localStorage.getItem("deviceId"),
	jellyfin: jellyfin,
}));

/**
 * Create api
 * @param {string} serverAddress
 * @param {string} accessToken
 * @returns
 */
export const createApi = (serverAddress, accessToken) =>
	useApi.setState((state) => ({
		...state,
		api: jellyfin.createApi(serverAddress, accessToken, axiosClient),
	}));
