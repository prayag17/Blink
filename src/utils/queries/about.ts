import type { Api } from "@jellyfin/sdk";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { queryOptions } from "@tanstack/react-query";
import { check } from "@tauri-apps/plugin-updater";

export const getSystemInfoQueryOptions = (api: Api | null | undefined) =>
	queryOptions({
		queryKey: ["about", "serverInfo"],
		queryFn: async () => {
			if (!api) {
				throw Error("API is not defined");
			}
			const result = await getSystemApi(api).getSystemInfo();
			return result.data;
		},
	});

export const getUpdateQueryOptions = queryOptions({
	queryKey: ["about", "checkForUpdates"],
	queryFn: async () => await check(),
});
