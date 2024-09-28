import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export const useCarouselStore = createWithEqualityFn(
	(set) => ({
		direction: "right",
		setDirection: (dir) => set(() => ({ direction: dir })),
	}),
	shallow,
);
