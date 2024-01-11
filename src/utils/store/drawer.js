import { create } from "zustand";

export const useDrawerStore = create((set) => ({
	open: false,
	setOpen: (sopen) => set((state) => ({ ...state, open: sopen })),
}));
