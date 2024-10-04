import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

const useSettingsStore = createWithEqualityFn(
	() => ({
		dialogOpen: false,
		tabValue: 0,
	}),
	shallow,
);

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
