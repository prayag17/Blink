import { useApiInContext } from "@/utils/store/api";
import { playItemFromQueue } from "@/utils/store/playback";
import useQueue from "@/utils/store/queue";
import { Button, Typography } from "@mui/material";
import React from "react";
import { getTypeIcon } from "../utils/iconsCollection";

import "./outroCard.scss";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useCentralStore } from "@/utils/store/central";
import { useMutation } from "@tanstack/react-query";

const OutroCard = (props: { handleShowCredits: () => void }) => {
	const api = useApiInContext((s) => s.api);
	const [nextItemIndex, queueItems] = useQueue((s) => [
		s.currentItemIndex,
		s.tracks,
	]);
	const item = queueItems?.[nextItemIndex + 1];
	const user = useCentralStore((s) => s.currentUser);
	const handlePlayNext = useMutation({
		mutationKey: ["playNextButton"],
		mutationFn: () => playItemFromQueue("next", user?.Id, api),
		onError: (error) => [console.error(error)],
	});
	if (!item || !item.Type) return null;
	return (
		<div className="outro-card">
			<Typography variant="h4">Up Next</Typography>
			<div className="outro-card-content">
				{item?.ImageTags?.Primary ? (
					<img
						className="outro-card-content-image"
						alt={item.Name ?? "Cover"}
						src={
							api &&
							getImageUrlsApi(api).getItemImageUrlById(
								item.Id ?? "",
								"Primary",
								{
									tag: item.ImageTags.Primary,
									quality: 80,
								},
							)
						}
					/>
				) : (
					<div className="outro-card-content-image icon">
						{getTypeIcon(item.Type)}
					</div>
				)}
				<Typography variant="h5" className="outro-card-content-title">
					{item.Name}
				</Typography>
				<Typography variant="subtitle2" className="outro-card-content-overview">
					{item.Overview}
				</Typography>
				<div className="outro-card-content-buttons">
					<Button
						onClick={handlePlayNext.mutate}
						//@ts-ignore
						color="white"
						variant="contained"
						startIcon={
							<div
								className="material-symbols-rounded fill"
								style={{
									zIndex: 1,
									fontSize: "2em",
								}}
							>
								play_arrow
							</div>
						}
					>
						Play Now
					</Button>
					<Button
						onClick={props.handleShowCredits}
						//@ts-ignore
						color="white"
						variant="outlined"
					>
						Watch Credits
					</Button>
				</div>
			</div>
		</div>
	);
};

export default OutroCard;