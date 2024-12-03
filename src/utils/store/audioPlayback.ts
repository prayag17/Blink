import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";

import type React from "react";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import playbackProfile from "../playback-profiles";

type AudioPlaybackStore = {
	display: boolean;
	url: string;
	item: BaseItemDto | undefined | null;
	playlistItemId: string | undefined;
	player: {
		currentTick: number;
		playing: boolean;
		ref: React.RefObject<HTMLAudioElement> | null;
	};
};
export const useAudioPlayback = createWithEqualityFn<AudioPlaybackStore>(
	() => ({
		display: false,
		url: "",
		item: undefined,
		playlistItemId: undefined,
		player: {
			currentTick: 0,
			playing: false,
			ref: null,
		},
	}),
	shallow,
);

export const playAudio = (
	url: string,
	item: BaseItemDto | undefined | null,
	playlistItemId?: string | undefined,
): void => {
	useAudioPlayback.setState({
		display: true,
		url,
		item,
		playlistItemId,
	});
};

export const generateAudioStreamUrl = (
	itemId: string,
	userId: string,
	deviceId: string,
	basePath: string,
	api_key: string,
) => {
	const transcodingProfile = playbackProfile.TranscodingProfiles?.filter(
		(val) => val.Type === "Audio" && val.Context === "Streaming",
	)[0];

	let directPlayContainers = "";
	if (playbackProfile.DirectPlayProfiles) {
		for (const p of playbackProfile.DirectPlayProfiles) {
			if (p.Type === "Audio") {
				if (directPlayContainers) {
					directPlayContainers += `, ${p.Container}`;
				} else {
					directPlayContainers = p.Container ?? "";
				}

				if (p.AudioCodec) {
					directPlayContainers += `| ${p.AudioCodec}`;
				}
			}
		}
	}
	const urlOptions = {
		userId,
		deviceId,
		api_key,
		container: directPlayContainers,
		maxAudioChannels: transcodingProfile?.MaxAudioChannels,
		transcodingContainer: transcodingProfile?.Container,
		transcodingProtocol: transcodingProfile?.Protocol,
		audioCodec: transcodingProfile?.AudioCodec,
		playSessionId: new Date().getTime(),
		startTimeTicks: 0,
		enableRemoteMedia: false,
		enableAudioVbrEncoding: true,
	};
	const urlParams = new URLSearchParams(urlOptions as any).toString();
	return `${basePath}/Audio/${itemId}/universal?${urlParams}`;
};

export const setAudioRef = (ref: React.RefObject<HTMLAudioElement>) => {
	const state = useAudioPlayback.getState();
	state.player.ref = ref;
	useAudioPlayback.setState(state);
};

export const setProgress = (ticks: number) => {
	const state = useAudioPlayback.getState();
	state.player.currentTick = ticks;
	useAudioPlayback.setState(state);
};