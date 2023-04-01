/** @format */

import { configureStore } from "@reduxjs/toolkit";
import sideBarReducer from "./utils/slice/sidemenu";
import appBarReducer from "./utils/slice/appBar";
export default configureStore({
	reducer: {
		sidebar: sideBarReducer,
		appBar: appBarReducer,
	},
});
