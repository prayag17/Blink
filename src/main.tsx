import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

//TODO: Need help implementing modal routes in TanStack Router
// const SearchMask = createRouteMask({
// 	routeTree,
// 	from: "/searchModal,
// 	to: "/search",
// 	params: true,
// });

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		api: undefined!,
		createApi: undefined!,
		user: undefined,
		jellyfinSDK: undefined!,
		fetchCurrentUser: undefined!,
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
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorNotice } from "./components/notices/errorNotice/errorNotice";
import { CentralProvider, useCentralStore } from "./utils/store/central";

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
	const [api, createApi, jellyfinSDK] = useApiInContext((s) => [
		s.api,
		s.createApi,
		s.jellyfin,
	]);
	const [user, fetchCurrentUser] = useCentralStore((s) => [
		s.currentUser,
		s.fetchCurrentUser,
	]);
	if (api?.accessToken) fetchCurrentUser(api);
	return (
		<RouterProvider
			router={router}
			context={{ api, createApi, user, jellyfinSDK, fetchCurrentUser }}
		/>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			{/* TODO: Create a proper loading fallback component */}
			<ErrorBoundary FallbackComponent={ErrorNotice}>
				<Suspense fallback={<h1>Loading in main.tsx</h1>}>
					<CentralProvider>
						<ApiProvider>
							<ProviderWrapper />
						</ApiProvider>
					</CentralProvider>
				</Suspense>
			</ErrorBoundary>
		</QueryClientProvider>
	</React.StrictMode>,
);

document.querySelector(".app-loading")!.classList.toggle("hidden");
