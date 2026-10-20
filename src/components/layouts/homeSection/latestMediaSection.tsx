import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Card } from "../../card/card";
import CardScroller from "../../cardScroller/cardScroller";
import { CardsSkeleton } from "../../skeleton/cards";

import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryLatestQueryOptions } from "@/utils/queries/items";

/**
 * @description Latest Media Section
 */
export const LatestMediaSection = ({
	latestMediaLib,
}: {
	latestMediaLib: BaseItemDto;
}) => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const data = useQuery(
		getLibraryLatestQueryOptions(api, user?.Id, latestMediaLib.Id),
	);
	if (data.isPending) {
		return <CardsSkeleton />;
	}
	if (data.isSuccess && (data.data?.length ?? 0) >= 1) {
		return (
			<CardScroller displayCards={7} title={`Latest ${latestMediaLib.Name}`}>
				{data.data?.map((item) => {
					return (
						<Card
							key={item.Id}
							item={item}
							seriesId={item.SeriesId}
							cardTitle={
								item.Type === BaseItemKind.Episode ? item.SeriesName : item.Name
							}
							imageType={"Primary"}
							cardCaption={
								item.Type === BaseItemKind.Episode
									? `S${item.ParentIndexNumber ?? 0}:E${
											item.IndexNumber ?? 0
										} - ${item.Name ?? "Unknown"}`
									: item.Type === BaseItemKind.Series
										? `${item.ProductionYear} - ${
												item.EndDate
													? new Date(item.EndDate).toLocaleString([], {
															year: "numeric",
														})
													: "Present"
											}`
										: item.ProductionYear
							}
							cardType={
								item.Type === BaseItemKind.MusicAlbum ||
								item.Type === BaseItemKind.Audio
									? "square"
									: "portrait"
							}
							queryKey={["home", "latestMedia", latestMediaLib.Id ?? ""]}
							userId={user?.Id}
						/>
					);
				})}
			</CardScroller>
		);
	}

	return <></>;
};
