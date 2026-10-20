import {
	type BaseItemDto,
	type MediaStream,
	MediaStreamType,
} from "@jellyfin/sdk/lib/generated-client";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import React, { useMemo, useState } from "react";
import type MediaQualityInfo from "@/utils/types/mediaQualityInfo";

const titleIncludes = (stream: MediaStream, ...needles: string[]) => {
	const title = stream.DisplayTitle?.toLocaleLowerCase();
	return needles.some((needle) => title?.includes(needle));
};

const getMediaQualityInfo = (
	videoTracks: MediaStream[],
	audioTracks: MediaStream[],
): MediaQualityInfo => ({
	isAtmos: audioTracks.some((a) => titleIncludes(a, "atmos")),
	isDolbyVision: videoTracks.some(
		(v) =>
			titleIncludes(v, "dv", "dolby vision") ||
			!!v.VideoDoViTitle ||
			v.VideoRangeType === "DOVI",
	),
	isDts: audioTracks.some(
		(a) =>
			titleIncludes(a, "dts") && !titleIncludes(a, "dts-hd ma", "dts-hd.ma"),
	),
	isDtsHDMA: audioTracks.some((a) =>
		titleIncludes(a, "dts-hd ma", "dts-hd.ma"),
	),
	isDD: audioTracks.some(
		(a) =>
			(titleIncludes(a, "dd") && !titleIncludes(a, "ddp")) ||
			(titleIncludes(a, "dolby digital") &&
				!titleIncludes(a, "dolby digital+")),
	),
	isDDP: audioTracks.some((a) => titleIncludes(a, "ddp", "dolby digital+")),
	isUHD: videoTracks.some((v) => titleIncludes(v, "4k", "2160p", "uhd")),
	isHD: videoTracks.some(
		(v) =>
			(titleIncludes(v, "hd") && !titleIncludes(v, "hdr")) ||
			titleIncludes(v, "1080p", "fhd"),
	),
	isSD: videoTracks.some(
		(v) =>
			(titleIncludes(v, "sd") && !titleIncludes(v, "sdr")) ||
			titleIncludes(v, "720p"),
	),
	isSDR: videoTracks.some((v) => v.VideoRangeType === "SDR"),
	isHDR: videoTracks.some(
		(v) => v.VideoRange === "HDR" || titleIncludes(v, "dv"),
	),
	isHDR10: videoTracks.some(
		(v) => v.VideoRangeType === "HDR10" && !titleIncludes(v, "hdr10+"),
	),
	isHDR10Plus: videoTracks.some(
		(v) => v.VideoRangeType === "HDR10Plus" || titleIncludes(v, "hdr10+"),
	),
	isTrueHD: audioTracks.some((a) => titleIncludes(a, "truehd")),
	isIMAX: videoTracks.some((v) => titleIncludes(v, "imax")),
});

/**
 * Splits an item's media streams into tracks, tracks the user's track selection
 * (reset whenever the item changes) and derives the media quality badges.
 */
export const useMediaTracks = (item: BaseItemDto) => {
	const tracks = useMemo(() => {
		const streams = item.MediaStreams ?? [];
		return {
			video: streams.filter((s) => s.Type === MediaStreamType.Video),
			audio: streams.filter((s) => s.Type === MediaStreamType.Audio),
			subtitle: streams.filter((s) => s.Type === MediaStreamType.Subtitle),
		};
	}, [item.MediaStreams]);

	const defaults = {
		itemId: item.Id,
		video:
			tracks.video.find((track) => track.IsDefault)?.Index ??
			tracks.video[0]?.Index ??
			0,
		audio: item.MediaSources?.[0]?.DefaultAudioStreamIndex ?? 0,
		subtitle: item.MediaSources?.[0]?.DefaultSubtitleStreamIndex ?? -1,
	};
	const [selection, setSelection] = useState(defaults);
	if (selection.itemId !== item.Id) {
		setSelection(defaults);
	}

	const mediaQualityInfo = useMemo(
		() => getMediaQualityInfo(tracks.video, tracks.audio),
		[tracks],
	);

	return {
		tracks,
		selection,
		setSelection: (patch: Partial<Omit<typeof defaults, "itemId">>) =>
			setSelection((prev) => ({ ...prev, ...patch })),
		mediaQualityInfo,
	};
};

type TrackSelectorsProps = Pick<
	ReturnType<typeof useMediaTracks>,
	"tracks" | "selection" | "setSelection"
>;

export const TrackSelectors = ({
	tracks,
	selection,
	setSelection,
}: TrackSelectorsProps) => (
	<>
		{tracks.video.length > 0 && (
			<TextField
				label="Video"
				select
				style={{ width: "100%", marginBottom: "1em" }}
				value={selection.video}
				variant="filled"
				onChange={(e) => setSelection({ video: Number(e.target.value) })}
			>
				{tracks.video.map((track) => (
					<MenuItem key={track.Index} value={track.Index}>
						{track.DisplayTitle}
					</MenuItem>
				))}
			</TextField>
		)}
		{tracks.audio.length > 0 && (
			<TextField
				label="Audio"
				select
				style={{ width: "100%", marginBottom: "1em" }}
				value={selection.audio}
				variant="filled"
				onChange={(e) => setSelection({ audio: Number(e.target.value) })}
			>
				{tracks.audio.map((track) => (
					<MenuItem key={track.Index} value={track.Index}>
						{track.DisplayTitle}
					</MenuItem>
				))}
			</TextField>
		)}
		{tracks.subtitle.length > 0 && (
			<TextField
				label="Subtitle"
				select
				style={{ width: "100%" }}
				value={selection.subtitle}
				variant="filled"
				slotProps={{ select: { MenuProps: { disablePortal: true } } }}
				onChange={(e) => setSelection({ subtitle: Number(e.target.value) })}
			>
				<MenuItem key={-1} value={-1}>
					No Subtitle
				</MenuItem>
				{tracks.subtitle.map((track) => (
					<MenuItem key={track.Index} value={track.Index}>
						{track.DisplayTitle}
					</MenuItem>
				))}
			</TextField>
		)}
	</>
);
