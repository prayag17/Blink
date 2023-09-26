/** @format */

import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../../card/card";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";

const GenreView = ({ libraryId, genreId, genreName, userId }) => {
	const items = useQuery({
		queryKey: ["library", "genreItem", genreId],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
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
				<div className="library-genre-header">
					<div className="library-genre-header-decoration"></div>
					<Typography
						noWrap
						variant="h5"
						color="textPrimary"
						className=""
					>
						{genreName}
					</Typography>
				</div>
				<div
					className="library-grid"
					style={{
						paddingTop: "0.5em",
					}}
				>
					{items.data.Items.map((item, index) => {
						return (
							<Card
								item={item}
								seriesId={item.SeriesId}
								cardTitle={
									item.Type == BaseItemKind.Episode
										? item.SeriesName
										: item.Name
								}
								imageType={"Primary"}
								cardCaption={
									item.Type == BaseItemKind.Episode
										? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
										: item.Type ==
										  BaseItemKind.Series
										? `${item.ProductionYear} - ${
												!!item.EndDate
													? new Date(
															item.EndDate,
													  ).toLocaleString(
															[],
															{
																year: "numeric",
															},
													  )
													: "Present"
										  }`
										: item.ProductionYear
								}
								disableOverlay={
									item.Type == BaseItemKind.Person ||
									item.Type ==
										BaseItemKind.MusicAlbum ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio
								}
								cardType={
									item.Type ==
										BaseItemKind.MusicAlbum ||
									item.Type == BaseItemKind.Audio ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio ||
									item.Type == BaseItemKind.Playlist
										? "square"
										: "portrait"
								}
								queryKey={[
									"library",
									"genreItem",
									genreId,
								]}
								userId={userId}
								imageBlurhash={
									!!item.ImageBlurHashes?.Primary &&
									item.ImageBlurHashes?.Primary[
										Object.keys(
											item.ImageBlurHashes
												.Primary,
										)[0]
									]
								}
							/>
						);
					})}
				</div>
			</div>
		);
	}
};

export default GenreView;
