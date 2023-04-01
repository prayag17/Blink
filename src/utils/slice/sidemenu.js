/** @format */

import { createSlice } from "@reduxjs/toolkit";
export const sideBarSlice = createSlice({
	name: "sidebar",
	initialState: {
		visible: false,
	},
	reducers: {
		showSidemenu: (state) => {
			state.visible = true;
		},
		hideSidemenu: (state) => {
			state.visible = false;
		},
	},
});

export const { showSidemenu, hideSidemenu } = sideBarSlice.actions;
export default sideBarSlice.reducer;
