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
			subtitleTracks: asub,
		})),
	setSelectedSubtitleTrack: (asub) =>
		set((state) => ({ ...state, selectedSubtitleTrack: asub })),
}));

export const usePlaybackDataLoadStore = create((set) => ({
	isLoading: false,
	setIsLoading: (loading) =>
		set((state) => ({
			...state,
			isLoading: loading,
		})),
}));
