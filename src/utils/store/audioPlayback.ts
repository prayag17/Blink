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
		volume: number;
		isMuted: boolean;
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
			volume: 0.8,
			isMuted: false,
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
		playSessionId: Date.now(),
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

export const setVolume = (volume: number) => {
	const state = useAudioPlayback.getState();
	state.player.volume = volume;
	useAudioPlayback.setState(state);
};

export const setIsMuted = (isMuted: boolean) => {
	const state = useAudioPlayback.getState();
	state.player.isMuted = isMuted;
	useAudioPlayback.setState(state);
};

export const stopPlayback = () => {
	const current = useAudioPlayback.getState();
	useAudioPlayback.setState({
		display: false,
		url: "",
		item: undefined,
		playlistItemId: undefined,
		player: {
			currentTick: 0,
			playing: false,
			ref: null,
			volume: current.player.volume,
			isMuted: current.player.isMuted,
		},
	});
};