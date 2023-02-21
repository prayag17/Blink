/** @format */

import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router } from "react-router-dom";
import { CookiesProvider } from "react-cookie";

import { invoke } from "@tauri-apps/api/tauri";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<CookiesProvider>
			<Router>
				<App />
			</Router>
		</CookiesProvider>
	</React.StrictMode>,
);

document.addEventListener("DOMContentLoaded", () => {
	// This will wait for the window to load, but you could
	// run this function on whatever trigger you want
	invoke("close_splashscreen");
});
