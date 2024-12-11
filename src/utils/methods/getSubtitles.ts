import type { MediaStream } from "@jellyfin/sdk/lib/generated-client";
import type subtitlePlaybackInfo from "../types/subtitlePlaybackInfo";

export default function getSubtitle(
	track: number | "nosub" | undefined,
	mediaStreams: MediaStream[] | undefined | null,
): subtitlePlaybackInfo | undefined {
	const availableSubtitles = mediaStreams?.filter(
		(stream) => stream.Type === "Subtitle",
	);
	if (track === "nosub" || track === -1)
		return {
			track: -1,
			enable: false,
			format: "vtt",
			allTracks: availableSubtitles,
			url: null,
		};
	const requiredSubtitle = availableSubtitles?.filter(
		(stream) => stream.Index === track,
	);
	const url = requiredSubtitle?.[0]?.DeliveryUrl;
	if (track) {
		return {
			track,
			enable: true,
			format: requiredSubtitle?.[0]?.Codec,
			allTracks: availableSubtitles,
			url,
		};
	}
	if (track === 0) {
		return {
			track: 0,
			enable: false,
			format: null,
			allTracks: availableSubtitles,
			url: null,
		};
	}
}