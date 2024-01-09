import { create } from "zustand";

export const useCarouselStore = create((set) => ({
	direction: "right",
	setDirection: (dir) => set(() => ({ direction: dir })),
}));
