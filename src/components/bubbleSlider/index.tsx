import { ticksToMs, ticksToSec } from "@/utils/date/time";
import {
	type VideoPlayerAction,
	VideoPlayerActionKind,
} from "@/utils/reducers/videoPlayerReducer";
import type audioPlaybackInfo from "@/utils/types/audioPlaybackInfo";
import type subtitlePlaybackInfo from "@/utils/types/subtitlePlaybackInfo";
import type { Api } from "@jellyfin/sdk";
import type {
	BaseItemDto,
	TrickplayInfo,
} from "@jellyfin/sdk/lib/generated-client";
import { Slider, Tooltip, Typography } from "@mui/material";
import type { Instance } from "@popperjs/core";
import React, {
	type RefObject,
	type ActionDispatch,
	type MouseEvent,
} from "react";
import { useRef, useState } from "react";
import type ReactPlayer from "react-player";

type BubbleSliderProps = {
	itemDuration: number;
	item: BaseItemDto;
	mediaSource: {
		videoTrack: number;
		audioTrack: number;
		container: string;
		id: string | undefined;
		subtitle: subtitlePlaybackInfo;
		audio: audioPlaybackInfo;
	};
	api: Api;
	chapterMarks: { value: number }[];
	sliderState: {
		isSeeking: boolean;
		sliderSeek: number;
		progress: number;
	};
	dispatch: ActionDispatch<[action: VideoPlayerAction]>;
	player: RefObject<ReactPlayer | null>;
};

const ticksDisplay = (ticks: number) => {
	const time = Math.round(ticks / 10000);
	let formatedTime = "";
	let timeSec = Math.floor(time / 1000);
	let timeMin = Math.floor(timeSec / 60);
	timeSec -= timeMin * 60;
	timeSec = timeSec === 0 ? 0o0 : timeSec;
	const timeHr = Math.floor(timeMin / 60);
	timeMin -= timeHr * 60;
	formatedTime = `${timeHr.toLocaleString([], {
		minimumIntegerDigits: 2,
		useGrouping: false,
	})}:${timeMin.toLocaleString([], {
		minimumIntegerDigits: 2,
		useGrouping: false,
	})}:${timeSec.toLocaleString([], {
		minimumIntegerDigits: 2,
		useGrouping: false,
	})}`;
	return formatedTime;
};

const BubbleSlider = ({
	itemDuration,
	item,
	mediaSource,
	api,
	chapterMarks,
	sliderState,
	dispatch,
	player,
}: BubbleSliderProps) => {
	const positionRef = useRef<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});
	const popperRef = useRef<Instance>(null);
	const areaRef = useRef<HTMLDivElement>(null);

	const [hoverProgress, setHoverProgress] = useState(0);

	const handleSliderHover = (event: MouseEvent) => {
		positionRef.current = { x: event.clientX, y: event.clientY };
		const rect = areaRef.current!.getBoundingClientRect();
		const width = rect.width;
		const distX = event.clientX - rect.left;
		const percentageCovered = distX / width;
		setHoverProgress(percentageCovered * itemDuration);
		if (popperRef.current != null) {
			popperRef.current.update();
		}
	};

	const sliderDisplayFormat = (value: number) => {
		const currentChapter = item?.Chapters?.filter((chapter, index) => {
			if (index + 1 === item.Chapters?.length) {
				return chapter;
			}
			if (
				(item.Chapters?.[index + 1]?.StartPositionTicks ?? value) - value >=
					0 &&
				(chapter.StartPositionTicks ?? value) - value < 0
			) {
				return chapter;
			}
		});

		let trickplayResolution: TrickplayInfo | undefined;
		const trickplayResolutions = mediaSource.id
			? item?.Trickplay?.[mediaSource.id]
			: null;
		if (trickplayResolutions) {
			let bestWidth: number | undefined;
			const maxWidth = window.screen.width * window.devicePixelRatio * 0.2;
			for (const [_, trickInfo] of Object.entries(trickplayResolutions)) {
				if (
					!bestWidth ||
					(trickInfo.Width &&
						((trickInfo.Width < bestWidth && bestWidth > maxWidth) ||
							(trickInfo.Width > bestWidth && bestWidth <= maxWidth)))
				) {
					bestWidth = trickInfo.Width;
				}
			}
			if (bestWidth) {
				trickplayResolution = trickplayResolutions[bestWidth];
			}
		}
		if (
			trickplayResolution?.TileWidth &&
			trickplayResolution.TileHeight &&
			trickplayResolution.Width &&
			trickplayResolution.Height
		) {
			const currentTrickplayImage = trickplayResolution?.Interval
				? Math.floor(ticksToMs(value) / trickplayResolution?.Interval)
				: 0;
			const trickplayImageSize =
				trickplayResolution?.TileWidth * trickplayResolution?.TileHeight; // this gives the area of a single tile

			const trickplayImageOffset = currentTrickplayImage % trickplayImageSize; // this gives the tile index inside a trickplay image
			const index = Math.floor(currentTrickplayImage / trickplayImageSize); // this gives the index of trickplay image

			const imageOffsetX =
				trickplayImageOffset % trickplayResolution?.TileWidth; // this gives the x coordinate of tile in trickplay image
			const imageOffsetY = Math.floor(
				trickplayImageOffset / trickplayResolution?.TileWidth,
			); // this gives the y coordinate of tile in trickplay image
			const backgroundOffsetX = -(imageOffsetX * trickplayResolution?.Width);
			const backgroundOffsetY = -(imageOffsetY * trickplayResolution?.Height);

			const imgUrlParamsObject: Record<string, string> = {
				api_key: String(api?.accessToken),
				MediaSourceId: mediaSource.id ?? "",
			};
			const imgUrlParams = new URLSearchParams(imgUrlParamsObject).toString();

			const imageAspectRatio =
				trickplayResolution.Width / trickplayResolution.Height;

			if (currentChapter?.[0]?.Name) {
				return (
					<div className="flex flex-column video-osb-bubble">
						<div
							className="video-osd-trickplayBubble"
							style={{
								background: `url(${api?.basePath}/Videos/${item?.Id}/Trickplay/${trickplayResolution.Width}/${index}.jpg?${imgUrlParams})`,
								backgroundPositionX: `${backgroundOffsetX}px`,
								backgroundPositionY: `${backgroundOffsetY}px`,
								width: "100%",
								aspectRatio: imageAspectRatio,
							}}
						/>
						<Typography variant="h6" px="12px" pt={1}>
							{currentChapter?.[0]?.Name}
						</Typography>
						<Typography px="12px" pb={1}>
							{ticksDisplay(value)}
						</Typography>
					</div>
				);
			}
			return (
				<div className="flex flex-column video-osb-bubble">
					<div
						className="video-osd-trickplayBubble"
						style={{
							background: `url(${api?.basePath}/Videos/${item?.Id}/Trickplay/${trickplayResolution.Width}/${index}.jpg?${imgUrlParams})`,
							backgroundPositionX: `${backgroundOffsetX}px`,
							backgroundPositionY: `${backgroundOffsetY}px`,
							width: "100%",
							aspectRatio: imageAspectRatio,
						}}
					/>
					<Typography variant="h6" px="12px" py={1}>
						{ticksDisplay(value)}
					</Typography>
				</div>
			);
		}

		if (currentChapter?.[0]?.Name) {
			return (
				<div className="flex flex-column video-osb-bubble">
					<Typography variant="h6" px="12px" pt={1}>
						{currentChapter?.[0]?.Name}
					</Typography>
					<Typography px={2} pb={1}>
						{ticksDisplay(value)}
					</Typography>
				</div>
			);
		}
		return (
			<div className="flex flex-column video-osb-bubble ">
				<Typography variant="h6" px="12px" py={1}>
					{ticksDisplay(value)}
				</Typography>
			</div>
		);
	};

	return (
		<Tooltip
			// title={sliderDisplayFormat(
			// 	positionRef.current.x - areaRef.current!.getBoundingClientRect().x,
			// )}
			key={`${positionRef.current}`}
			title={sliderDisplayFormat(hoverProgress)}
			placement="top"
			slotProps={{
				popper: {
					popperRef,
					anchorEl: {
						getBoundingClientRect: () => {
							return new DOMRect(
								positionRef.current.x,
								areaRef.current!.getBoundingClientRect().y,
								0,
								0,
							);
						},
					},
					// disablePortal: true,
				},
				tooltip: {
					// className: "glass",
					style: {
						width: "34em",
						overflow: "hidden",
						padding: "12px",
						borderRadius: "20px",
					},
				},
			}}
		>
			<Slider
				value={
					sliderState.isSeeking ? sliderState.sliderSeek : sliderState.progress
				}
				max={itemDuration}
				step={1}
				onChange={(_, newValue) => {
					dispatch({
						type: VideoPlayerActionKind.SET_SEEKING,
						payload: true,
					});
					Array.isArray(newValue)
						? dispatch({
								type: VideoPlayerActionKind.SET_SLIDER_SEEK,
								payload: newValue[0],
							})
						: dispatch({
								type: VideoPlayerActionKind.SET_SLIDER_SEEK,
								payload: newValue,
							});
				}}
				onChangeCommitted={(_, newValue) => {
					dispatch({
						type: VideoPlayerActionKind.SET_SEEKING,
						payload: false,
					});
					Array.isArray(newValue)
						? dispatch({
								type: VideoPlayerActionKind.SET_SLIDER_SEEK,
								payload: newValue[0],
							})
						: dispatch({
								type: VideoPlayerActionKind.SET_SLIDER_SEEK,
								payload: newValue,
							});
					if (Array.isArray(newValue)) {
						player.current?.seekTo(ticksToSec(newValue[0]), "seconds");
					} else {
						player.current?.seekTo(ticksToSec(newValue), "seconds");
					}
				}}
				sx={{
					"& .MuiSlider-thumb": {
						width: 14,
						height: 14,
						transition: "0.1s ease-in-out",
						opacity: 0,
						"&.Mui-active": {
							width: 20,
							height: 20,
							opacity: 1,
						},
					},
					"&:hover .MuiSlider-thumb": {
						opacity: 1,
					},
					"& .MuiSlider-rail": {
						opacity: 0.28,
						background: "white",
					},
				}}
				marks={chapterMarks}
				valueLabelDisplay="off"
				ref={areaRef}
				onMouseMove={handleSliderHover}
			/>
		</Tooltip>
	);
};

export default BubbleSlider;
