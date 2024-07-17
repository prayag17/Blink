import type { MediaStream } from "@jellyfin/sdk/lib/generated-client";
import type subtitlePlaybackInfo from "../types/subtitlePlaybackInfo";

export default function getSubtitle(
	track: number | "nosub",
	mediaStreams: MediaStream[] | undefined | null,
): subtitlePlaybackInfo {
	const availableSubtitles = mediaStreams?.filter(
		(stream) => stream.Type === "Subtitle",
	);
	if (availableSubtitles?.length === 0)
		return { track: -2, enable: false, format: "vtt" };
	if (track === "nosub") return { track: -1, enable: false, format: "vtt" };
	const requiredSubtitle = availableSubtitles?.filter(
		(stream) => stream.Index === track,
	);
	const url = requiredSubtitle?.[0]?.DeliveryUrl;
	console.log(track);
	if (track === "nosub") {
		return {
			track,
			enable: false,
			format: null,
			allTracks: availableSubtitles,
			url: null,
		};
	}
	return {
		track,
		enable: true,
		format: requiredSubtitle?.[0]?.Codec,
		allTracks: availableSubtitles,
		url,
	};
}