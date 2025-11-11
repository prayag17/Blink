import { create } from "zustand";

type HeaderStoreType = {
	pageTitle: string | null;
	setPageTitle: (title: string | null) => void;
};

const useHeaderStore = create<HeaderStoreType>((set) => ({
	pageTitle: null,
	setPageTitle: (title: string | null) => set(() => ({ pageTitle: title })),
}));

export default useHeaderStore;
