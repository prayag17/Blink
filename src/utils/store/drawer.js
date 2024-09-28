import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export const useDrawerStore = createWithEqualityFn(
	(set) => ({
		open: false,
		setOpen: (sopen) => set((state) => ({ ...state, open: sopen })),
	}),
	shallow,
);
