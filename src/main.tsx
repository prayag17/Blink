import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import React, { Suspense, useEffect } from "react";
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
	scrollRestoration: true,
	scrollRestorationBehavior: "smooth",
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

import { ErrorBoundary } from "react-error-boundary";
import { ErrorNotice } from "./components/notices/errorNotice/errorNotice";
import { ApiProvider, useApiInContext } from "./utils/store/api";
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

// biome-ignore lint/nursery/useComponentExportOnlyModules : This is a valid use case for a component export
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
	if (api?.accessToken && !user?.Id) {
		fetchCurrentUser(api);
	}
	useEffect(() => {
		if (api) {
			console.log(`API is set - Route ${window.location.pathname}`);
			console.log(api);
		} else {
			console.log(`API is not set - Route ${window.location.pathname}`);
		}
		router.invalidate(); // This is a hack to force the router to re-evaluate the routes and re-run the beforeLoad functions
	}, [api]);
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
