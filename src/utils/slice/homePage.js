/** @format */

import { createSlice } from "@reduxjs/toolkit";

export const homePageSlice = createSlice({
	name: "homePage",
	initialState: [
		{
			type: "libs",
			name: "Libraries",
			data: [],
			// isLoading: libraries.isLoading,
			isLoading: false,
		},
		{
			type: "resumeVideo",
			name: "Continue Watching",
			data: [],
			// isLoading: resumeItemsVideo.isLoading,
			isLoading: false,
		},
		{
			type: "resumeAudio",
			name: "Continue Listnening",
			data: [],
			// isLoading: resumeItemsAudio.isLoading,
			isLoading: false,
		},
		{
			type: "nextup",
			name: "Next Up",
			data: [],
			// isLoading: upNextItems.isLoading,
			isLoading: false,
		},
	],
	reducers: {
		setData: (state, action) => {
			switch (action.payload[0]) {
				case "libs":
					state[0].data = action.payload[1];
					break;
				case "resumeVideo":
					state[1].data = action.payload[1];
					break;
				case "resumeAudio":
					state[2].data = action.payload[1];
					break;
				case "nextup":
					state[3].data = action.payload[1];
					break;
				default:
					break;
			}
		},
		addLatestMedia: (state, action) => {
			state.push(action.payload);
		},
	},
});

export const { setData, addLatestMedia } = homePageSlice.actions;
export default homePageSlice.reducer;
