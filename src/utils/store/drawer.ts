import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

type DrawerStore = {
	open: boolean;
	setOpen: (sopen: boolean) => void;
};

export const useDrawerStore = createWithEqualityFn<DrawerStore>(
	(set) => ({
		open: false,
		setOpen: (sopen) => {
			set(() => ({ open: sopen }));
		},
	}),
	shallow,
);
