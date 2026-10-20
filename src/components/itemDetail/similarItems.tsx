import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import { getSimilarItemsQueryOptions } from "@/utils/queries/itemDetail";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";

export const getItemCardTitle = (item: BaseItemDto) =>
	item.Type === BaseItemKind.Episode ? item.SeriesName : item.Name;

export const getItemCardCaption = (item: BaseItemDto) => {
	if (item.Type === BaseItemKind.Episode) {
		return `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`;
	}
	if (item.Type === BaseItemKind.Series) {
		const end = item.EndDate
			? new Date(item.EndDate).toLocaleString([], { year: "numeric" })
			: "Present";
		return `${item.ProductionYear} - ${end}`;
	}
	return item.ProductionYear;
};

const SimilarItems = ({ item }: { item: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const id = item.Id ?? "";
	const similarItems = useQuery(
		getSimilarItemsQueryOptions(api, user?.Id, id, item.Type),
	);

	if (!similarItems.data?.TotalRecordCount) return null;

	return (
		<CardScroller
			title="You might also like"
			displayCards={7}
			disableDecoration
		>
			{similarItems.data.Items?.map((similar) => (
				<Card
					key={similar.Id}
					item={similar}
					seriesId={similar.SeriesId}
					cardTitle={getItemCardTitle(similar)}
					imageType="Primary"
					cardCaption={getItemCardCaption(similar)}
					cardType={
						similar.Type === BaseItemKind.MusicAlbum ||
						similar.Type === BaseItemKind.Audio
							? "square"
							: "portrait"
					}
					queryKey={["item", id, "similarItem"]}
					userId={user?.Id}
				/>
			))}
		</CardScroller>
	);
};

export default SimilarItems;
