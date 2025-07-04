import { create } from "zustand";

type BackdropStore = {
	backdropHash: string;
	// backdropId: string;
	setBackdrop: (hash: string | undefined) => void;
};

export const useBackdropStore = create<BackdropStore>((set) => ({
	backdropHash: "",
	// backdropI: "",
	setBackdrop: (hash) => set(() => ({ backdropHash: hash })),
}));
