import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import BoxSetView from "@/components/itemDetail/views/boxSetView";
import DefaultView from "@/components/itemDetail/views/defaultView";
import PersonView from "@/components/itemDetail/views/personView";
import SeriesView from "@/components/itemDetail/views/seriesView";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ItemSkeleton from "@/components/skeleton/item";
import {
	getUpcomingEpisodesQueryOptions,
	prefetchItemDetail,
} from "@/utils/queries/itemDetail";
import { getItemQueryOptions } from "@/utils/queries/items";
import { useCentralStore } from "@/utils/store/central";

type ItemSearch = {
	/** Item type hint from the link, used to prefetch type-specific data in parallel. */
	type?: BaseItemKind;
};

const itemKinds = new Set<string>(Object.values(BaseItemKind));

export const Route = createFileRoute("/_api/item/$id")({
	validateSearch: (search: Record<string, unknown>): ItemSearch => ({
		type:
			typeof search.type === "string" && itemKinds.has(search.type)
				? (search.type as BaseItemKind)
				: undefined,
	}),
	loaderDeps: ({ search }) => ({ type: search.type }),
	loader: async ({
		context: { queryClient, api, user },
		params,
		deps: { type },
	}) => {
		if (!api || !user?.Id) return;
		const itemPromise = queryClient.ensureQueryData(
			getItemQueryOptions(params.id, api, user.Id),
		);
		if (type) {
			prefetchItemDetail(queryClient, api, user.Id, params.id, type);
		}
		const item = await itemPromise;
		if (item.Type !== type) {
			// No (or wrong) hint, e.g. a deep link: prefetch now that the type is known.
			prefetchItemDetail(queryClient, api, user.Id, params.id, item.Type);
		}
		if (item.Type === BaseItemKind.Episode) {
			queryClient.prefetchQuery(
				getUpcomingEpisodesQueryOptions(api, user.Id, item),
			);
		}
	},
	component: ItemPage,
	pendingComponent: () => <ItemSkeleton />,
	errorComponent: () => <ErrorNotice />,
});

function ItemPage() {
	const { id } = Route.useParams();
	const api = Route.useRouteContext().api;
	const user = useCentralStore((s) => s.currentUser);
	const { data: item } = useSuspenseQuery(
		getItemQueryOptions(id, api, user?.Id),
	);

	switch (item.Type) {
		case BaseItemKind.Series:
			return <SeriesView key={id} item={item} />;
		case BaseItemKind.BoxSet:
			return <BoxSetView key={id} item={item} />;
		case BaseItemKind.Person:
			return <PersonView key={id} item={item} />;
		default:
			return <DefaultView key={id} item={item} />;
	}
}
