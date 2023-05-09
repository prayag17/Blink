/** @format */

import { create } from "zustand";

export const usePlaybackStore = create((set) => ({
	url: "",
	startPosition: 0,
	itemId: "",
	itemName: "",
	setUrl: (aurl) => set((state) => ({ ...state, url: aurl })),
	setPosition: (apos) => set((state) => ({ ...state, startPosition: apos })),
	setItemId: (aid) => set((state) => ({ ...state, itemId: aid })),
	setItemName: (anm) => set((state) => ({ ...state, itemName: anm })),
}));
