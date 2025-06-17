import type { Api } from "@jellyfin/sdk";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/**
 * @param api Api instance
 * @param userId user's id
 * @param id library id
 * @returns query options for the current library
 */
export const getLibraryQueryOptions = (
	api: Api | null | undefined,
	userId: string | null | undefined,
	id: string,
) =>
	queryOptions({
		queryKey: ["library", "currentLib", id],
		queryFn: async () => {
			if (!api || !userId) throw Error(useTranslation().t("errors.apiOrUser"));
			const result = await getUserLibraryApi(api).getItem({
				userId: userId,
				itemId: id,
			});
			return result.data;
		},
	});
