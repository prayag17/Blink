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
	defaultPreload: "intent",
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

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
	const [api, createApi] = useApiInContext((s) => [s.api, s.createApi]);
	return <RouterProvider router={router} context={{ api, createApi }} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			{/* TODO: Create a proper loading fallback component */}
			<Suspense fallback={<h1>Loading in main.tsx</h1>}>
				<ApiProvider>
					<ProviderWrapper />
				</ApiProvider>
			</Suspense>
		</QueryClientProvider>
	</React.StrictMode>,
);

document.querySelector(".app-loading")!.classList.toggle("hidden");
