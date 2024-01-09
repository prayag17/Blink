import { create } from "zustand";

const initialState = {
	display: false,
	url: "",
	item: {},
	tracks: [],
	currentTrack: 0,
	playlistItemId: "",
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
	setPlaylistItemId: (aitem) =>
		set((state) => ({ ...state, playlistItemId: aitem })),
	setTracks: (aitem) => set((state) => ({ ...state, tracks: aitem })),
	setCurrentTrack: (aitem) =>
		set((state) => ({ ...state, currentTrack: aitem })),
	reset: () => set(initialState),
}));
