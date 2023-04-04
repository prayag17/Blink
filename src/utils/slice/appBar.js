/** @format */

import { createSlice } from "@reduxjs/toolkit";
export const appBarSlice = createSlice({
	name: "appBar",
	initialState: {
		visible: false,
		backdrop: false,
		page: undefined,
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
		setPage: (state, action) => {
			state.page = action.payload;
		},
		removePage: (state) => {
			state.page = undefined;
		},
	},
});

export const { showAppBar, hideAppBar, setBackdrop, setPage, removePage } =
	appBarSlice.actions;
export default appBarSlice.reducer;
