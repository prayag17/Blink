import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import {
	ApiProvider,
	initializeApi,
	useApiInContext,
} from "./utils/store/api";
import { CentralProvider, useCentralStore } from "./utils/store/central";

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
		queryClient,
	},
	defaultPreload: false,
	defaultPreloadStaleTime: 0,
	defaultViewTransition: true,
	scrollRestoration: true,
	scrollRestorationBehavior: "auto",
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

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
	useEffect(() => {
		if (api?.accessToken && !user?.Id) {
			fetchCurrentUser(api);
		}
	}, [api, user, fetchCurrentUser]);
	useEffect(() => {
		if (api) {
			console.log(`API is set - Route ${window.location.pathname}`);
			console.log(api);
		} else {
			console.log(`API is not set - Route ${window.location.pathname}`);
		}
		router.invalidate(); // This is a hack to force the router to re-evaluate the routes and re-run the beforeLoad functions
	}, [api?.accessToken]);
	return (
		<RouterProvider
			router={router}
			context={{
				api,
				createApi,
				user,
				jellyfinSDK,
				fetchCurrentUser,
				// queryClient,
			}}
		/>
	);
}

const init = async () => {
	const initialApi = await initializeApi();

	ReactDOM.createRoot(document.getElementById("root")!).render(
		<React.StrictMode>
			<QueryClientProvider client={queryClient}>
				<CentralProvider>
					<ApiProvider initialApi={initialApi}>
						<ProviderWrapper />
					</ApiProvider>
				</CentralProvider>
			</QueryClientProvider>
		</React.StrictMode>,
	);
};

init();

document.querySelector(".app-loading")!.classList.toggle("hidden");
