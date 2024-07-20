import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Card } from "../../card/card";
import { CardScroller } from "../../cardScroller/cardScroller";
import { CardsSkeleton } from "../../skeleton/cards";

import { useApiInContext } from "@/utils/store/api";
import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

/**
 * @description Latest Media Section
 */
export const LatestMediaSection = ({
	latestMediaLib,
}: { latestMediaLib: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});
	const fetchLatestMedia = async (library: BaseItemDto) => {
		const media = await getUserLibraryApi(api).getLatestMedia({
			userId: user.data?.Id,
			parentId: library.Id,
			limit: 16,
			fields: ["PrimaryImageAspectRatio"],
		});
		return media.data;
	};
	const data = useQuery({
		queryKey: ["home", "latestMedia", latestMediaLib.Id],
		queryFn: () => fetchLatestMedia(latestMediaLib),
		enabled: !!user.data,
		refetchOnMount: true,
	});
	if (data.isPending) {
		return <CardsSkeleton />;
	}
	if (data.isSuccess && data.data.length >= 1) {
		return (
			<CardScroller displayCards={7} title={`Latest ${latestMediaLib.Name}`}>
				{data.data.map((item) => {
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
							queryKey={["home", "latestMedia", latestMediaLib.Id]}
							userId={user.data?.Id}
							imageBlurhash={
								!!item.ImageBlurHashes?.Primary &&
								item.ImageBlurHashes?.Primary[
									Object.keys(item.ImageBlurHashes.Primary)[0]
								]
							}
						/>
					);
				})}
			</CardScroller>
		);
	}

	return <></>;
};
