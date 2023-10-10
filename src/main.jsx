/** @format */

import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router } from "react-router-dom";

import App from "./App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: "always",
			cacheTime: 120000,
		},
		mutations: {
			networkMode: "always",
		},
	},
});

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<Router>
				<App />
			</Router>
		</QueryClientProvider>
	</React.StrictMode>,
);

document.addEventListener("DOMContentLoaded", () => {
	// This will wait for the window to load, but you could
	// run this function on whatever trigger you want
	console.info("Initial render complete");
	document
		.querySelector(".app-loading")
		.setAttribute("style", "display:none");
});
