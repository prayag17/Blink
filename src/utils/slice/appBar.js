/** @format */

import { createSlice } from "@reduxjs/toolkit";
export const appBarSlice = createSlice({
	name: "appBar",
	initialState: {
		visible: false,
		backdrop: false,
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
	},
});

export const { showAppBar, hideAppBar, setBackdrop } = appBarSlice.actions;
export default appBarSlice.reducer;
