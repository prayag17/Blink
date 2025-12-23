import type { TrickplayInfo } from "@jellyfin/sdk/lib/generated-client";
import { Slider, Tooltip, Typography } from "@mui/material";
import type { Instance } from "@popperjs/core";
import React, {
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useShallow } from "zustand/shallow";
import { ticksToMs } from "@/utils/date/time";
import { useApiInContext } from "@/utils/store/api";
import { usePlaybackStore } from "@/utils/store/playback";

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

const BubbleSlider = () => {
	const api = useApiInContext((state) => state.api);
	const {
		seekValue,
		currentTime,
		isUserSeeking,
		// setIsUserSeeking,
		// setSeekValue,
		// seekTo,
		itemDuration,
		itemChapters,
		mediaSource,
		itemTrickplay,
		itemId,
		handleStartSeek,
		handleStopSeek,
	} = usePlaybackStore(
		useShallow((state) => ({
			seekValue: state.playerState.seekValue,
			currentTime: state.playerState.currentTime,
			isUserSeeking: state.playerState.isUserSeeking,
			// setIsUserSeeking: state.setIsUserSeeking,
			// setSeekValue: state.setSeekValue,
			// seekTo: state.seekTo,
			itemDuration: state.metadata.item.RunTimeTicks,
			itemChapters: state.metadata.item.Chapters,
			mediaSource: state.mediaSource,
			itemTrickplay: state.metadata.item.Trickplay,
			itemId: state.metadata.item.Id,
			handleStartSeek: state.handleStartSeek,
			handleStopSeek: state.handleStopSeek,
		})),
	);

	const positionRef = useRef<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});
	const popperRef = useRef<Instance>(null);
	const areaRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number | null>(null);

	const [hoverProgress, setHoverProgress] = useState(0);

	useEffect(() => {
		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, []);

	const handleSliderHover = useCallback(
		(event: MouseEvent) => {
			const clientX = event.clientX;
			const clientY = event.clientY;

			if (
				positionRef.current.x === clientX &&
				positionRef.current.y === clientY
			) {
				return;
			}

			positionRef.current = { x: clientX, y: clientY };

			if (rafRef.current) return;

			rafRef.current = requestAnimationFrame(() => {
				if (areaRef.current) {
					const rect = areaRef.current.getBoundingClientRect();
					const width = rect.width;
					const distX = clientX - rect.left;
					const percentageCovered = distX / width;
					setHoverProgress(percentageCovered * (itemDuration ?? 0));
					if (popperRef.current != null) {
						popperRef.current.update();
					}
				}
				rafRef.current = null;
			});
		},
		[itemDuration],
	);

	const chapterMarks = useMemo(() => {
		const marks: { value: number }[] = [];
		itemChapters?.forEach((val) => {
			marks.push({ value: val.StartPositionTicks ?? 0 });
		});
		return marks;
	}, [itemChapters]);

	const sliderDisplayFormat = (value: number) => {
		const currentChapter = itemChapters?.filter((chapter, index) => {
			if (index + 1 === itemChapters?.length) {
				return true;
			}
			if (
				(itemChapters?.[index + 1]?.StartPositionTicks ?? value) - value >= 0 &&
				(chapter.StartPositionTicks ?? value) - value < 0
			) {
				return true;
			}
			return false;
		});

		let trickplayResolution: TrickplayInfo | undefined;
		const trickplayResolutions = mediaSource.id
			? itemTrickplay?.[mediaSource.id]
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
		let trickplayStyle: React.CSSProperties | undefined;

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

			const _imageAspectRatio =
				trickplayResolution.Width / trickplayResolution.Height;

			trickplayStyle = {
				backgroundImage: `url(${api?.basePath}/Videos/${itemId}/Trickplay/${trickplayResolution.Width}/${index}.jpg?${imgUrlParams})`,
				backgroundPositionX: `${backgroundOffsetX}px`,
				backgroundPositionY: `${backgroundOffsetY}px`,
				width: `${trickplayResolution.Width}px`,
				height: `${trickplayResolution.Height}px`,
				borderBottom: "1px solid rgba(255,255,255,0.1)",
				borderRadius: 0,
			};
		}

		const chapterName = currentChapter?.[0]?.Name;

		return (
			<div
				className="flex flex-column video-osb-bubble"
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					width: "100%",
				}}
			>
				{trickplayStyle && (
					<div className="video-osd-trickplayBubble" style={trickplayStyle} />
				)}
				<div
					style={{
						padding: "8px 12px",
						textAlign: "center",
						width: "100%",
						boxSizing: "border-box",
					}}
				>
					{chapterName && (
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: "bold",
								mb: 0.5,
								color: "white",
								textShadow: "0 2px 4px rgba(0,0,0,0.5)",
							}}
						>
							{chapterName}
						</Typography>
					)}
					<Typography
						variant="body2"
						sx={{
							color: "rgba(255,255,255,0.9)",
							fontVariantNumeric: "tabular-nums",
							fontWeight: 500,
						}}
					>
						{ticksDisplay(value)}
					</Typography>
				</div>
			</div>
		);
	};

	const virtualAnchorEl = useMemo(() => {
		return {
			getBoundingClientRect: () => {
				return new DOMRect(
					positionRef.current.x,
					areaRef.current?.getBoundingClientRect().y ?? 0,
					0,
					0,
				);
			},
		};
	}, []);

	return (
		<Tooltip
			// title={sliderDisplayFormat(
			// 	positionRef.current.x - areaRef.current!.getBoundingClientRect().x,
			// )}
			title={sliderDisplayFormat(hoverProgress)}
			placement="top"
			slotProps={{
				popper: {
					popperRef,
					anchorEl: virtualAnchorEl,
					// disablePortal: true,
				},
				tooltip: {
					className: "glass",
					style: {
						width: "auto",
						maxWidth: "none",
						overflow: "hidden",
						padding: "0",
						borderRadius: "12px",
					},
				},
			}}
		>
			<Slider
				value={isUserSeeking ? seekValue : currentTime}
				max={itemDuration ?? 0}
				step={1}
				onChange={(_, newValue) => {
					// setIsUserSeeking(true);
					Array.isArray(newValue)
						? handleStartSeek(newValue[0])
						: handleStartSeek(newValue);
				}}
				onChangeCommitted={(_, newValue) => {
					// setIsUserSeeking(false);
					// Array.isArray(newValue)
					// 	? setSeekValue(newValue[0])
					// 	: setSeekValue(newValue);
					if (Array.isArray(newValue)) {
						handleStopSeek(newValue[0]);
					} else {
						handleStopSeek(newValue);
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
