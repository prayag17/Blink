import type { Api } from "@jellyfin/sdk";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import Typography from "@mui/material/Typography";
import React from "react";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";

interface PlayerInfoProps {
	item: BaseItemDto | undefined | null;
	api: Api | undefined;
	trackName?: string;
}

const PlayerInfo = ({ item, api, trackName }: PlayerInfoProps) => {
	if (!api || !item) return null;

	return (
		<div className="audio-player-info">
			<div className="audio-player-image-container">
				<img
					alt={trackName ?? "track"}
					className="audio-player-image"
					src={getImageUrlsApi(api).getItemImageUrlById(
						(!item?.ImageTags?.Primary ? item?.AlbumId : item.Id) ?? "",
						"Primary",
						{
							quality: 85,
							fillHeight: 462,
							fillWidth: 462,
						},
					)}
				/>
				<span className="material-symbols-rounded audio-player-image-icon">
					music_note
				</span>
			</div>
			<div className="audio-player-info-text">
				<Typography
					variant="subtitle2"
					style={{
						width: "100%",
					}}
					noWrap
				>
					{item?.Name}
				</Typography>
				<Typography
					variant="caption"
					style={{
						opacity: 0.5,
					}}
					noWrap
				>
					by {item?.Artists?.map((artist) => artist).join(",")}
				</Typography>
			</div>
		</div>
	);
};

export default PlayerInfo;
