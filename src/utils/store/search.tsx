import { create } from "zustand";

type SearchStore = {
	showSearchDialog: boolean;
	toggleSearchDialog: () => void;
};

const useSearchStore = create<SearchStore>((set) => ({
	showSearchDialog: false,
	toggleSearchDialog: () =>
		set((state) => ({ showSearchDialog: !state.showSearchDialog })),
}));

export default useSearchStore;
