import type {
	BaseItemDtoQueryResult,
	PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client";

interface PlayResult {
	item: BaseItemDtoQueryResult;
	mediaSource: PlaybackInfoResponse;
}

export default PlayResult;