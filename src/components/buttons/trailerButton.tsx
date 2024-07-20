import type { MediaUrl } from "@jellyfin/sdk/lib/generated-client";
import { Dialog, IconButton } from "@mui/material";
import React, { useState } from "react";
import ReactPlayer from "react-player";

type TrailerButtonType = {
	trailerItem: MediaUrl[];
	disabled: boolean;
};

const TrailerButton = (props: TrailerButtonType) => {
	const [dialog, setDialog] = useState(false);
	return (
		<>
			<IconButton
				disabled={props.disabled ?? false}
				onClick={() => setDialog(true)}
			>
				<span className="material-symbols-rounded">theaters</span>
			</IconButton>
			<Dialog
				maxWidth="md"
				fullWidth
				open={dialog}
				PaperProps={{
					style: {
						overflow: "hidden",
					},
				}}
				onClose={() => setDialog(false)}
			>
				<ReactPlayer
					playing={false}
					url={props.trailerItem[0]?.Url}
					width="100%"
					height="auto"
					style={{
						aspectRatio: "16/9",
					}}
					controls
				/>
			</Dialog>
		</>
	);
};

export default TrailerButton;
