/** @format */

import { createSlice } from "@reduxjs/toolkit";
export const appBarSlice = createSlice({
	name: "appBar",
	initialState: {
		visible: false,
		backButtonVisible: false,
	},
	reducers: {
		showAppBar: (state) => {
			state.visible = true;
		},
		hideAppBar: (state) => {
			state.visible = false;
		},
		showBackButton: (state, action) => {
			state.backButtonVisible = true;
		},
		hideBackButton: (state) => {
			state.backButtonVisible = false;
		},
	},
});

export const { showAppBar, hideAppBar, showBackButton, hideBackButton } =
	appBarSlice.actions;
export default appBarSlice.reducer;
