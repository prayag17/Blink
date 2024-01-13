import { create } from "zustand";

export const useBackdropStore = create((set) => ({
	backdropUrl: "",
	backdropId: "",
	setBackdrop: (url, id) =>
		set((state) => ({ backdropUrl: url, backdropId: id })),
}));

export const setBackdrop = (url, id) => {
	useBackdropStore.setState(() => ({ backdropUrl: url, backdropId: id }));
};
