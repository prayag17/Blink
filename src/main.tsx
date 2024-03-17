import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter as Router } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: "always",
			staleTime: 1 * 60 * 1000, // 1 minute,
			refetchInterval: 10 * 60 * 1000, // 10 minutes,
		},
		mutations: {
			networkMode: "always",
		},
	},
});

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<Router>
				<App />
			</Router>
		</QueryClientProvider>
	</React.StrictMode>,
);

document.querySelector(".app-loading")!.classList.toggle("hidden");
