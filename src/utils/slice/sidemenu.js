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
	},
});

export const { showSidemenu } = sideBarSlice.actions;
export default sideBarSlice.reducer;
