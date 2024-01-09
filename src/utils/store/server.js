import { create } from "zustand";

export const useServerStore = create(() => ({
	reachable: true,
}));
export const setServerReachability = (reach) =>
	useServerStore.setState(() => ({ reachable: reach }));
