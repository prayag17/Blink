/**
 * @deprecated - Check @/utils/playback-profiles/index
 */

import { DlnaProfileType } from "@jellyfin/sdk/lib/generated-client";

type ResponseProfile = {
	Type: DlnaProfileType;
	Container: string;
	MimeType: string;
};

/**
 * Returns a valid ResponseProfile for the current platform.
 *
 * @returns An array of subtitle profiles for the current platform.
 */
export function getResponseProfiles(): ResponseProfile[] {
	const ResponseProfiles = [];

	ResponseProfiles.push({
		Type: DlnaProfileType.Video,
		Container: "m4v",
		MimeType: "video/mp4",
	});

	return ResponseProfiles;
}
