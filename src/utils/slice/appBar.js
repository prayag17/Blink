/** @format */

import { createSlice } from "@reduxjs/toolkit";
export const appBarSlice = createSlice({
	name: "appBar",
	initialState: {
		visible: false,
		backdrop: false,
		backButtonVisible: false,
	},
	reducers: {
		showAppBar: (state) => {
			state.visible = true;
		},
		hideAppBar: (state) => {
			state.visible = false;
		},
		setBackdrop: (state, action) => {
			state.backdrop = action.payload;
		},
		showBackButton: (state, action) => {
			state.backButtonVisible = true;
		},
		hideBackButton: (state) => {
			state.backButtonVisible = false;
		},
	},
});

export const {
	showAppBar,
	hideAppBar,
	setBackdrop,
	showBackButton,
	hideBackButton,
} = appBarSlice.actions;
export default appBarSlice.reducer;
