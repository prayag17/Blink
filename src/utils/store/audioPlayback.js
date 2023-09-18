/** @format */

import { create } from "zustand";

const initialState = {
	url: "",
	display: false,
	item: {},
	tracks: [],
	currentTrack: 0,
};

export const useAudioPlayback = create((set) => ({
	...initialState,
	setUrl: (aurl) => set((state) => ({ ...state, url: aurl })),
	setDisplay: (adisplay) =>
		set((state) => ({
			...state,
			display: adisplay,
		})),
	setItem: (aitem) => set((state) => ({ ...state, item: aitem })),
	setTracks: (aitem) => set((state) => ({ ...state, tracks: aitem })),
	setCurrentTrack: (aitem) =>
		set((state) => ({ ...state, currentTrack: aitem })),
	reset: () => set(initialState),
}));
