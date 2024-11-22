import type {
	BaseItemDtoQueryResult,
	MediaSegmentDtoQueryResult,
	PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client";
import type IntroMediaInfo from "./introMediaInfo";

interface PlayResult {
	item: BaseItemDtoQueryResult | undefined;
	mediaSource: PlaybackInfoResponse | undefined;
	introInfo: MediaSegmentDtoQueryResult | undefined;
}

export default PlayResult;