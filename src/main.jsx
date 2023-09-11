/** @format */

import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router } from "react-router-dom";

import { invoke } from "@tauri-apps/api/tauri";

import App from "./App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: "always",
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
	invoke("close_splashscreen");
});
