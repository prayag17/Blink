/** @format */

import IconButton from "@mui/material/IconButton";
import { MdiPlayOutline } from "../icons/mdiPlayOutline";
import { usePlaybackStore } from "../../utils/store/playback";
import { useNavigate } from "react-router-dom";

const PlayButton = ({
	itemId,
	mediaSources,
	currentAudioTrack,
	currentSubTrack,
	currentVideoTrack,
	itemName,
	seriesName,
	itemIndex,
	itemParentIndex,
	itemRuntimeTicks,
	itemPlaybackPositionTicks,
	itemType,
	className,
	sx,
	iconProps,
}) => {
	const navigate = useNavigate();
	const [
		setUrl,
		setPosition,
		setDuration,
		setItemId,
		setItemName,
		setSubtitleTracksStore,
		setSelectedSubtitleTrack,
	] = usePlaybackStore((state) => [
		state.setUrl,
		state.setPosition,
		state.setDuration,
		state.setItemId,
		state.setItemName,
		state.setSubtitleTracks,
		state.setSelectedSubtitleTrack,
	]);
	const handleClick = (e) => {
		e.stopPropagation();
		setUrl(
			`${window.api.basePath}/Videos/${itemId}/stream.${mediaSources[0].Container}?Static=true&mediaSourceId=${itemId}&deviceId=${window.api.deviceInfo.id}&api_key=${window.api.accessToken}&Tag=${mediaSources[0].ETag}&videoStreamIndex=${currentVideoTrack}&audioStreamIndex=${currentAudioTrack}`,
		);
		setPosition(itemPlaybackPositionTicks);
		setItemName(
			itemType == "Episode"
				? `${seriesName} S${itemParentIndex}:E${itemIndex} ${itemName}`
				: itemName,
		);
		setItemId(itemId);
		setDuration(itemRuntimeTicks);
		// setSubtitleTracksStore(subtitleTracks);
		setSelectedSubtitleTrack(currentSubTrack);
		navigate(`/player`);
	};
	return (
		<IconButton className={className} onClick={handleClick} sx={sx}>
			<MdiPlayOutline {...iconProps} />
		</IconButton>
	);
};

export default PlayButton;
