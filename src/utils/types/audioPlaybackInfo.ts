import type { MediaStream } from "@jellyfin/sdk/lib/generated-client";

type audioPlaybackInfo = {
	track: number;
	allTracks: MediaStream[] | undefined;
};

export default audioPlaybackInfo;