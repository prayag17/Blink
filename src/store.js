/** @format */

import { configureStore } from "@reduxjs/toolkit";
import sideBarReducer from "./utils/slice/sidemenu";
export default configureStore({
	reducer: {
		sidebar: sideBarReducer,
	},
});
