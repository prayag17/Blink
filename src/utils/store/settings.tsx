import { create } from "zustand";

const useSettingsStore = create(() => ({
	dialogOpen: false,
	tabValue: 0,
}));

const setDialogOpen = (dialog: boolean) =>
	useSettingsStore.setState((state) => ({ ...state, dialogOpen: dialog }));

const setTabValue = (value: number) => {
	useSettingsStore.setState((state) => ({ ...state, tabValue: value }));
};

export default useSettingsStore;
export {
	setDialogOpen as setSettingsDialogOpen,
	setTabValue as setSettingsTabValue,
};
