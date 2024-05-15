import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		api: undefined!,
		createApi: undefined!,
	},
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

import { ThemeProvider } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { theme } from "./theme";
import { ApiProvider, useApiInContext } from "./utils/store/api";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: "always",
		},
		mutations: {
			networkMode: "always",
		},
	},
});

function ProviderWrapper() {
	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);
	return <RouterProvider router={router} context={{ api, createApi }} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<Suspense fallback={<h1>Fuck react</h1>}>
				<ApiProvider>
					<ProviderWrapper />
				</ApiProvider>
			</Suspense>
		</QueryClientProvider>
	</React.StrictMode>,
);

document.querySelector(".app-loading")!.classList.toggle("hidden");
