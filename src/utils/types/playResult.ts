import type {
	BaseItemDtoQueryResult,
	PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client";
import type IntroMediaInfo from "./introMediaInfo";

interface PlayResult {
	item: BaseItemDtoQueryResult;
	mediaSource: PlaybackInfoResponse;
	introInfo: IntroMediaInfo | undefined;
}

export default PlayResult;