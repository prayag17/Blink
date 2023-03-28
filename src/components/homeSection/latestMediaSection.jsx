/** @format */

import { useQuery } from "@tanstack/react-query";
import { CardScroller } from "../../components/cardScroller/cardScroller";
import { Card } from "../../components/card/card";
import { CardsSkeleton } from "../skeleton/cards";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

export const LatestMediaSection = ({ latestMediaLib }) => {
	const user = useQuery({
		queryKey: ["home", "user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
	});
	const fetchLatestMedia = async (library) => {
		const media = await getUserLibraryApi(window.api).getLatestMedia({
			userId: user.data.Id,
			parentId: library,
			limit: 16,
			fields: ["PrimaryImageAspectRatio"],
		});
		return media.data;
	};
	const data = useQuery({
		queryKey: ["homeSection, latestMedia", latestMediaLib],
		queryFn: () => fetchLatestMedia(latestMediaLib[0]),
		enabled: !!user.data,
	});
	if (data.isLoading) {
		return <CardsSkeleton />;
	}
	if (data.isSuccess && data.data.length >= 1) {
		return (
			<CardScroller
				displayCards={8}
				title={"Latest " + latestMediaLib[1]}
			>
				{data.data.map((item, index) => {
					return (
						<Card
							key={index}
							itemName={
								!!item.SeriesId
									? item.SeriesName
									: item.Name
							}
							itemId={
								!!item.SeriesId
									? item.SeriesId
									: item.Id
							}
							// imageTags={false}
							imageTags={!!item.ImageTags.Primary}
							iconType={item.Type}
							subText={item.ProductionYear}
							playedPercent={
								item.UserData.PlayedPercentage
							}
							cardOrientation={
								item.PrimaryImageAspectRatio == 1
									? "sqaure"
									: "portait"
							}
						></Card>
					);
				})}
			</CardScroller>
		);
	}

	return <></>;
};
