/** @format */

import { create } from "zustand";

export const usePlaybackStore = create((set) => ({
	url: "",
	startPosition: 0,
	duration: 0,
	itemId: "",
	itemName: "",
	subtitleTracks: [],
	selectedSubtitleTrack: 0,
	setUrl: (aurl) => set((state) => ({ ...state, url: aurl })),
	setPosition: (apos) => set((state) => ({ ...state, startPosition: apos })),
	setDuration: (adur) => set((state) => ({ ...state, duration: adur })),
	setItemId: (aid) => set((state) => ({ ...state, itemId: aid })),
	setItemName: (anm) => set((state) => ({ ...state, itemName: anm })),
	setSubtitleTracks: (asub) =>
		set((state) => ({
			...state,
			subtitleTracks: [
				{
					kind: "subtitles",
					src: `http://localhost:8096/Videos/e2d0ae00-f458-d4d4-7e09-1768ca0f485c/e2d0ae00f458d4d47e091768ca0f485c/Subtitles/0/0/Stream.vtt?api_key=${window.api.accessToken}`,
					srcLang: "en",
					default: true,
				},
			],
		})),
	setSelectedSubtitleTrack: (asub) =>
		set((state) => ({ ...state, selectedSubtitleTrack: asub })),
}));
