/** @format */

import { create } from "zustand";

export const useAppLoadingStore = create((set) => ({
	isLoading: false,
	isSuccess: false,
	isError: false,
	setIsLoading: (loading) =>
		set((state) => ({ ...state, isLoading: loading })),
	setIsSuccess: (success) =>
		set((state) => ({ ...state, isSuccess: success })),
	setIsError: (error) => set((state) => ({ ...state, isError: error })),
}));
