import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { create } from "zustand";
import { setQueue } from "./queue";

import type React from "react";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { secToTicks } from "../date/time";

type AudioPlaybackStore = {
	display: boolean;
	url: string;
	item: BaseItemDto | undefined | null;
	playlistItemId: string | undefined;
	player: {
		currentTick: number;
		playing: boolean;
		ref: React.Ref<HTMLAudioElement> | null;
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
	playlistItemId: string | undefined,
	queue: BaseItemDto[] | undefined,
	queueItemIndex: number,
): void => {
	useAudioPlayback.setState({
		display: true,
		url,
		item,
		playlistItemId,
	});
	setQueue(queue, queueItemIndex);
};

export const generateAudioStreamUrl = (
	itemId: string,
	userId: string,
	deviceId: string,
	basePath: string,
) => {
	const urlOptions = {
		userId,
		deviceId,
	};
	const urlParams = new URLSearchParams(urlOptions).toString();
	return `${basePath}/Audio/${itemId}/universal?${urlParams}`;
};

export const setAudioRef = (ref) => {
	const state = useAudioPlayback.getState();
	state.player.ref = ref;
	useAudioPlayback.setState(state);
};

export const setProgress = (ticks: number) => {
	const state = useAudioPlayback.getState();
	state.player.currentTick = ticks;
	useAudioPlayback.setState(state);
};