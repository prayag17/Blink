import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import React from "react";
import { Card } from "../../../card/card";
import { CardScroller } from "../../../cardScroller/cardScroller";

const GenreView = ({ libraryId, genreId, genreName, userId }) => {
	const api = useRouteContext({ from: "/" }).api;

	const items = useQuery({
		queryKey: ["library", "genreItem", genreId],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				genreIds: [genreId],
				parentId: libraryId,
				userId: userId,
			});
			return result.data;
		},
	});
	if (items.isSuccess && items.data.Items.length > 0) {
		return (
			<div className="library-genre">
				<CardScroller title={genreName} displayCards={8} disableDecoration>
					{items.data.Items.map((item) => {
						return (
							<Card
								key={item.Id}
								item={item}
								seriesId={item.SeriesId}
								cardTitle={
									item.Type === BaseItemKind.Episode
										? item.SeriesName
										: item.Name
								}
								imageType={"Primary"}
								cardCaption={
									item.Type === BaseItemKind.Episode
										? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
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
								disableOverlay={
									item.Type === BaseItemKind.Person ||
									item.Type === BaseItemKind.MusicAlbum ||
									item.Type === BaseItemKind.Genre ||
									item.Type === BaseItemKind.MusicGenre ||
									item.Type === BaseItemKind.Studio
								}
								cardType={
									item.Type === BaseItemKind.MusicAlbum ||
									item.Type === BaseItemKind.Audio ||
									item.Type === BaseItemKind.Genre ||
									item.Type === BaseItemKind.MusicGenre ||
									item.Type === BaseItemKind.Studio ||
									item.Type === BaseItemKind.Playlist
										? "square"
										: "portrait"
								}
								queryKey={["library", "genreItem", genreId]}
								userId={userId}
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
			</div>
		);
	}
};

export default GenreView;
