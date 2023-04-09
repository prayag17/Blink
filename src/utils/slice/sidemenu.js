/** @format */

import { createSlice } from "@reduxjs/toolkit";
export const sideBarSlice = createSlice({
	name: "sidebar",
	initialState: {
		visible: false,
		backdrop: true,
	},
	reducers: {
		showSidemenu: (state) => {
			state.visible = true;
		},
		hideSidemenu: (state) => {
			state.visible = false;
		},
		setBackdrop: (state, action) => {
			state.backdrop = action.payload;
		},
	},
});

export const { showSidemenu, hideSidemenu, setBackdrop } = sideBarSlice.actions;
export default sideBarSlice.reducer;
