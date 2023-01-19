/** @format */

import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router } from "react-router-dom";
import { CookiesProvider } from "react-cookie";

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
