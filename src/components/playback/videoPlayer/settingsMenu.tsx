import { MenuItem, Popover, TextField } from "@mui/material";
import { toNumber } from "lodash";
import React, {
	type ChangeEventHandler,
	useCallback,
	useMemo,
	useTransition,
} from "react";
import { useShallow } from "zustand/shallow";
import { useApiInContext } from "@/utils/store/api";
import {
	changeAudioTrack,
	changeSubtitleTrack,
	usePlaybackStore,
} from "@/utils/store/playback";

type VideoPlayerSettingsMenuProps = {
	settingsMenuRef: HTMLButtonElement | null;
	handleClose: () => void;
};

const VideoPlayerSettingsMenu = ({
	settingsMenuRef,
	handleClose,
}: VideoPlayerSettingsMenuProps) => {
	const settingsMenuOpen = useMemo(() => {
		return Boolean(settingsMenuRef);
	}, [settingsMenuRef]);

	const api = useApiInContext((state) => state.api);

	const { mediaSource, setIsBuffering } = usePlaybackStore(
		useShallow((state) => ({
			mediaSource: state.mediaSource,
			setIsBuffering: state.setIsBuffering,
		})),
	);

	const [subtitleIsChanging, startSubtitleChange] = useTransition();
	const handleSubtitleChange: ChangeEventHandler<
		HTMLInputElement | HTMLTextAreaElement
	> = useCallback(
		(e) => {
			startSubtitleChange(() => {
				if (mediaSource.subtitle.allTracks) {
					changeSubtitleTrack(
						toNumber(e.target.value),
						mediaSource.subtitle.allTracks,
					);
					handleClose();
				}
			});
		},
		[mediaSource.subtitle?.allTracks],
	);

	const [audioTackIsChanging, startAudioTrackChange] = useTransition();
	const handleAudioTrackChange: ChangeEventHandler<
		HTMLInputElement | HTMLTextAreaElement
	> = (e) => {
		// setPlaying(false);
		startAudioTrackChange(() => {
			if (api && mediaSource.audio.allTracks) {
				changeAudioTrack(toNumber(e.target.value), api);
				handleClose();
				setIsBuffering(true);
			}
		});

		// setPlaying(true);
	};

	return (
		<Popover
			anchorEl={settingsMenuRef}
			open={settingsMenuOpen}
			onClose={handleClose}
			slotProps={{
				paper: {
					style: {
						maxHeight: "20em",
						display: "flex",
						flexDirection: "column",
						gap: "1em",
						width: "24em",
						padding: "1em",
						borderRadius: "12px",
					},
					className: "glass",
				},
			}}
			anchorOrigin={{
				vertical: "bottom",
				horizontal: "right",
			}}
			transformOrigin={{
				vertical: "top",
				horizontal: "right",
			}}
		>
			<TextField
				select
				label="Audio"
				variant="outlined"
				value={mediaSource.audio?.track}
				onChange={handleAudioTrackChange}
				fullWidth
				disabled={audioTackIsChanging}
			>
				{mediaSource.audio?.allTracks?.map((sub) => (
					<MenuItem key={sub.Index} value={sub.Index}>
						{sub.DisplayTitle}
					</MenuItem>
				))}
			</TextField>
			<TextField
				select
				label="Subtitles"
				variant="outlined"
				value={mediaSource.subtitle?.track}
				onChange={handleSubtitleChange}
				fullWidth
				disabled={mediaSource.subtitle?.track === -2 || subtitleIsChanging}
			>
				<MenuItem key={-1} value={-1}>
					No Subtitle
				</MenuItem>
				{mediaSource.subtitle?.allTracks?.map((sub) => (
					<MenuItem key={sub.Index} value={sub.Index}>
						{sub.DisplayTitle}
					</MenuItem>
				))}
			</TextField>
		</Popover>
	);
};

export default VideoPlayerSettingsMenu;
