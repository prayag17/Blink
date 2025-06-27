import { IconButton, Menu, MenuItem } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { ticksToSec } from "@/utils/date/time";
import { usePlaybackStore } from "@/utils/store/playback";

const ChaptersListButton = () => {
	const { itemChapters, seekTo } = usePlaybackStore(
		useShallow((state) => ({
			itemChapters: state.metadata.item?.Chapters,
			seekTo: state.seekTo,
		})),
	);
	const [showChapterList, setShowChapterList] =
		React.useState<null | HTMLElement>(null);
	const handleShowChapterList = (event: React.MouseEvent<HTMLElement>) => {
		setShowChapterList(event.currentTarget);
	};

	return (
		<>
			<IconButton
				disabled={itemChapters?.length === 0}
				onClick={handleShowChapterList}
			>
				<span className="material-symbols-rounded">list</span>
			</IconButton>
			<Menu
				open={Boolean(showChapterList)}
				anchorEl={showChapterList}
				onClose={() => setShowChapterList(null)}
				anchorOrigin={{
					vertical: "top",
					horizontal: "center",
				}}
				transformOrigin={{
					vertical: "bottom",
					horizontal: "center",
				}}
			>
				{itemChapters?.length &&
					itemChapters?.map((chapter) => (
						<MenuItem
							key={chapter.Name}
							onClick={() => {
								seekTo(ticksToSec(chapter.StartPositionTicks ?? 0));
								setShowChapterList(null); // Close the chapter list menu
							}}
						>
							{chapter.Name}
						</MenuItem>
					))}
			</Menu>
		</>
	);
};

export default ChaptersListButton;
