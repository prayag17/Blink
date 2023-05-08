/** @format */

import { create } from "zustand";

export const usePlaybackStore = create((set) => ({
	url: "",
	setUrl: (aurl) => set(() => ({ url: aurl })),
}));
