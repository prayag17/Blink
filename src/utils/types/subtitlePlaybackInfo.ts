import type { MediaStream } from "@jellyfin/sdk/lib/generated-client";

export default interface subtitlePlaybackInfo {
		enable: boolean;
		track: number;
		format: "vtt" | "ass" | "ssa" | "subrip" | undefined | null | string;
		allTracks: undefined | MediaStream[];
		url: string | undefined | null;
	}
