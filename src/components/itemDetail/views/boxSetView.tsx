import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import PlayButton from "@/components/buttons/playButton";
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import { getCollectionItemsQueryOptions } from "@/utils/queries/itemDetail";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import ItemDetailLayout, { ExternalLinks } from "../itemDetailLayout";
import SimilarItems, { getItemCardTitle } from "../similarItems";

const BoxSetView = ({ item }: { item: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const id = item.Id ?? "";
	const collectionItems = useQuery(
		getCollectionItemsQueryOptions(api, user?.Id, id),
	);

	return (
		<ItemDetailLayout
			item={item}
			variant="boxset"
			showTrailer={false}
			playButton={
				<PlayButton
					item={item}
					itemType={item.Type ?? "BoxSet"}
					userId={user?.Id}
					buttonProps={{ fullWidth: true }}
				/>
			}
			aside={<ExternalLinks item={item} />}
		>
			{(collectionItems.data?.TotalRecordCount ?? 0) > 0 && (
				<CardScroller title="" displayCards={7} disableDecoration>
					{collectionItems.data?.Items?.map((collectionItem) => (
						<Card
							key={collectionItem.Id}
							item={collectionItem}
							seriesId={collectionItem.SeriesId}
							cardTitle={getItemCardTitle(collectionItem)}
							imageType="Primary"
							cardCaption={collectionItem.ProductionYear}
							cardType="portrait"
							queryKey={["item", id]}
							userId={user?.Id}
						/>
					))}
				</CardScroller>
			)}
			<SimilarItems item={item} />
		</ItemDetailLayout>
	);
};

export default BoxSetView;
