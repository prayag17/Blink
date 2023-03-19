/** @format */

import { configureStore } from "@reduxjs/toolkit";
import sideBarReducer from "./utils/slice/sidemenu";
import homePageReducer from "./utils/slice/homePage";

export default configureStore({
	reducer: {
		sidebar: sideBarReducer,
		homePage: homePageReducer,
	},
});
