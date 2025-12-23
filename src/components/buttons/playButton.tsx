import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import type { SxProps } from "@mui/material";
import Button, { type ButtonProps } from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useSnackbar } from "notistack";
import React, { type MouseEvent, memo } from "react"; // Import memo
import type PlayResult from "@//utils/types/playResult";
import { getRuntimeCompact } from "@/utils/date/time";
import { getNextEpisode, getPlaybackInfo } from "@/utils/methods/playback";
import { useApiInContext } from "@/utils/store/api";
import { generateAudioStreamUrl, playAudio } from "@/utils/store/audioPlayback";
import { usePhotosPlayback } from "@/utils/store/photosPlayback";
import { initializePlayback } from "@/utils/store/playback";
import { setQueue } from "@/utils/store/queue";

type PlayButtonProps = {
	item: BaseItemDto;
	userId: string | undefined;
	itemType: BaseItemKind;
	currentAudioTrack?: number | "auto";
	currentVideoTrack?: number;
	currentSubTrack?: number | "nosub";
	className?: string;
	sx?: SxProps;
	buttonProps?: ButtonProps;
	iconOnly?: boolean;
	audio?: boolean;
	size?: "small" | "large" | "medium";
	playlistItem?: boolean;
	playlistItemId?: string;
	trackIndex?: number;
};

// Memoized LinearProgress component
const MemoizedLinearProgress = memo(({ value }: { value: number }) => (
	<LinearProgress
		variant="determinate"
		value={value}
		sx={{
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			height: "100%",
			background: "transparent",
			opacity: 0.2,
			zIndex: 0,
			mixBlendMode: "difference",
		}}
		//@ts-expect-error
		color="white"
	/>
));

const PlayButton = ({
	item,
	userId,
	itemType,
	currentAudioTrack,
	currentSubTrack,
	// currentVideoTrack,
	className,
	sx,
	buttonProps,
	iconOnly,
	audio = false,
	size = "large",
	playlistItem,
	playlistItemId = "",
}: PlayButtonProps) => {
	const api = useApiInContext((s) => s.api);
	const navigate = useNavigate();
	// const setPlaybackDataLoading = usePlaybackDataLoadStore(
	// 	(state) => state.setisPending,
	// );
	const playPhotos = usePhotosPlayback((s) => s.playPhotos);

	const { enqueueSnackbar } = useSnackbar();

	const itemQuery = useMutation({
		mutationKey: ["playButton", item?.Id, userId],
		mutationFn: async (currentEpisodeId?: string) => {
			if (!api) {
				throw new Error("API is not available");
			}
			if (!userId) {
				throw new Error("User ID is not available");
			}
			if (!item.Id) {
				throw new Error("Item ID is not available");
			}

			return await getPlaybackInfo(api, userId, item, {
				currentAudioTrack,
				currentSubTrack,
				currentEpisodeId,
				playlistItem,
				playlistItemId,
			});
		},
		onSuccess: async (result: PlayResult | null) => {
			if (!api) {
				console.error("API is not available");
				enqueueSnackbar("API is not available", { variant: "error" });
				return;
			}
			if (!userId) {
				console.error("User ID is not available");
				enqueueSnackbar("User ID is not available", { variant: "error" });
				return;
			}
			if (!result?.item?.Items?.length) {
				console.error("No items found");
				enqueueSnackbar("No items found", { variant: "error" });
				return;
			}
			if (!result?.item?.Items?.[0]?.Id) {
				console.error("No item ID found");
				enqueueSnackbar("No item ID found", { variant: "error" });
				return;
			}

			if (audio) {
				// Album/Individual audio track playback
				const playbackUrl = generateAudioStreamUrl(
					result?.item?.Items?.[0].Id,
					userId,
					api?.deviceInfo.id,
					api.basePath,
					api.accessToken,
				);
				playAudio(playbackUrl, result?.item?.Items?.[0], undefined);
				setQueue(result?.item?.Items ?? [], 0);
			} else if (item.Type === "Photo") {
				const index = result?.item?.Items?.map((i) => i.Id).indexOf(item.Id);
				if (result?.item?.Items && index) {
					playPhotos(result?.item?.Items, index);
					navigate({ to: "/player/photos" });
				}
			} else {
				if (!result?.mediaSource?.MediaSources?.[0]?.Id) {
					console.error("No media source ID found");
					enqueueSnackbar("No media source ID found", { variant: "error" });
					return;
				}
				const episodeIndex = result.episodeIndex;
				const queue = result?.item?.Items ?? [];

				let playItemValue = queue[episodeIndex];
				if (itemType === BaseItemKind.Movie) {
					playItemValue = queue[0];
				}

				if (!playItemValue) {
					console.error("No item to play found");
					return;
				}

				const startPosition = playItemValue.UserData?.PlaybackPositionTicks;

				initializePlayback({
					api,
					userId,
					item: playItemValue,
					mediaSource: result.mediaSource,
					mediaSegments: result.mediaSegments,
					queueItems: queue,
					queueIndex: episodeIndex,
					startPositionTicks: startPosition,
				});
				navigate({ to: "/player" });
			}
		},
		onSettled: () => {
			// setPlaybackDataLoading(false);
		},
		onError: (error) => {
			console.error(error);
			enqueueSnackbar(`${error}`, {
				variant: "error",
			});
		},
	});
	const handleClick = (
		e: MouseEvent<HTMLAnchorElement | MouseEvent>,
		currentEpisodeId?: string | undefined,
	) => {
		e.stopPropagation();
		itemQuery.mutate(currentEpisodeId);
	};
	const currentEpisode = useQuery({
		queryKey: ["playButton", "currentEpisode", item?.Id],
		queryFn: async () => {
			if (!api) {
				throw new Error("API is not available");
			}
			if (!userId) {
				throw new Error("User ID is not available");
			}
			if (!item.Id) {
				throw new Error("Item ID is not available");
			}
			const seasons = await getTvShowsApi(api).getSeasons({
				seriesId: item.Id,
				userId: userId,
				enableUserData: true,
			});

			const currentSeason = seasons.data.Items?.find((season) => {
				return season.UserData?.Played !== true;
			});

			const episode = await getNextEpisode(
				api,
				userId,
				item.Id,
				currentSeason?.IndexNumber ?? 0,
			);
			if (episode) {
				return { Items: [episode] };
			}
			return { Items: [] };
		},
		enabled: itemType === BaseItemKind.Series,
	});

	if (iconOnly) {
		return (
			//@ts-expect-error
			<Fab
				color="primary"
				aria-label="Play"
				className={className}
				onClick={(e) => {
					if (item.Type === "Episode") {
						handleClick(e, item.Id);
					} else if (itemType === BaseItemKind.Series) {
						handleClick(e, currentEpisode.data?.Items?.[0]?.Id);
					} else {
						handleClick(e);
					}
				}}
				sx={sx}
				size={size}
				disabled={
					itemType === BaseItemKind.Series &&
					(!currentEpisode.data ||
						!currentEpisode.data.Items ||
						currentEpisode.data.Items.length === 0)
				}
				{...buttonProps}
			>
				<div
					className="material-symbols-rounded em-4 fill"
					style={{
						fontSize: "3em",
					}}
				>
					play_arrow
				</div>
			</Fab>
		);
	}

	if (itemType === BaseItemKind.Series) {
		return (
			<div
				className="play-button"
				style={{
					width: "auto",
					position: "relative",
				}}
			>
				<Button
					loading={currentEpisode.isPending}
					className={className ?? "play-button"}
					variant="contained"
					onClick={(e) => {
						const episodeId = currentEpisode.data?.Items?.[0]?.Id;
						if (episodeId) {
							handleClick(e, episodeId);
						}
					}}
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
					{...buttonProps}
					sx={{
						position: "relative",
						overflow: "hidden",
					}}
					//@ts-expect-error - white color is a custom color in the theme which mui's types don't know about
					color="white"
					size={size}
					disabled={
						currentEpisode.isPending ||
						!currentEpisode.data ||
						!currentEpisode.data.Items ||
						currentEpisode.data.Items.length === 0 ||
						!currentEpisode.data.Items[0].Id
					}
				>
					{currentEpisode.isPending ? (
						"Loading..."
					) : !currentEpisode.data ||
						!currentEpisode.data.Items ||
						currentEpisode.data.Items.length === 0 ? (
						"No episodes to watch found"
					) : (
						<>
							Watch S{currentEpisode.data.Items[0].ParentIndexNumber ?? 1}E
							{currentEpisode.data.Items[0]?.IndexNumber ?? 1}
							<MemoizedLinearProgress
								//@ts-expect-error
								value={
									100 >
										(currentEpisode.data.Items[0].UserData?.PlayedPercentage ??
											100) &&
									(currentEpisode.data.Items[0].UserData?.PlayedPercentage ??
										0) > 0
										? currentEpisode.data.Items[0].UserData?.PlayedPercentage
										: 0
								}
							/>
						</>
					)}
				</Button>
				{(currentEpisode.data?.Items?.[0]?.UserData?.PlaybackPositionTicks ??
					0) > 0 && (
					<Typography
						sx={{
							opacity: 0.8,
							position: "absolute",
							bottom: "-1.8em",
							left: "50%",
							transform: "translate(-50%)",
						}}
						variant="caption"
					>
						{getRuntimeCompact(
							(currentEpisode.data?.Items?.[0]?.RunTimeTicks ?? 0) -
								(currentEpisode.data?.Items?.[0]?.UserData
									?.PlaybackPositionTicks ?? 0),
						)}{" "}
						left
					</Typography>
				)}
			</div>
		);
	}
	return (
		<div
			className="play-button"
			style={{
				width: "auto",
				position: "relative",
			}}
		>
			<Button
				className={className ?? "play-button"}
				variant="contained"
				onClick={(e) =>
					item.Type === "Episode" ? handleClick(e, item.Id) : handleClick(e)
				}
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
				{...buttonProps}
				sx={{
					position: "relative",
					overflow: "hidden",
				}}
				//@ts-expect-error - white color is a custom color in the theme which mui's types don't know about
				color="white"
				size={size}
			>
				{item.UserData?.PlaybackPositionTicks
					? "Continue Watching"
					: item?.Type === "MusicAlbum" ||
							item?.Type === "Audio" ||
							item?.Type === "AudioBook" ||
							item?.Type === "Playlist" ||
							audio
						? "Play Now"
						: "Watch Now"}
				<MemoizedLinearProgress
					//@ts-expect-error
					value={
						100 > (item.UserData?.PlayedPercentage ?? 100) &&
						(item.UserData?.PlayedPercentage ?? 0) > 0
							? item.UserData?.PlayedPercentage
							: 0
					}
				/>
			</Button>
			{(item.UserData?.PlaybackPositionTicks ?? 0) > 0 && (
				<Typography
					sx={{
						opacity: 0.8,
						position: "absolute",
						bottom: "-1.8em",
						left: "50%",
						transform: "translate(-50%)",
					}}
					variant="caption"
				>
					{getRuntimeCompact(
						(item.RunTimeTicks ?? 0) -
							(item.UserData?.PlaybackPositionTicks ?? 0),
					)}{" "}
					left
				</Typography>
			)}
		</div>
	);
};

export default PlayButton;
