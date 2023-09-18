/** @format */

import { create } from "zustand";

export const useAudioPlayback = create((set) => ({
	url: "",
	display: false,
	item: {},
	setUrl: (aurl) => set((state) => ({ ...state, url: aurl })),
	setDisplay: (adisplay) =>
		set((state) => ({
			...state,
			display: adisplay,
		})),
	setItem: (aitem) => set((state) => ({ ...state, item: aitem })),
}));
