import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type ReactPlayer from "react-player";

type VideoPlayerState = {
	ref: React.RefObject<ReactPlayer | null>;
	isPlayerReady: boolean;
	isPlayerPlaying: boolean;
	isPlayerMuted: boolean;
	isPlayerFullscreen: boolean;
	/**
	 * Volume of the player
	 * @type {number} 0 to 1
	 */
	playerVolume: number;
	isSeeking: boolean;
	sliderSeek: number;
	/**
	 * Progress of the video
	 * @type {number} in C# ticks
	 */
	progress: number;
	isHovering: boolean;
};

export enum VideoPlayerActionKind {
	SET_PLAYER_REF = "SET_PLAYER_REF",
	SET_PLAYER_READY = "SET_PLAYER_READY",
	SET_PLAYER_PLAYING = "SET_PLAYER_PLAYING",
	SET_PLAYER_MUTED = "SET_PLAYER_MUTED",
	SET_PLAYER_FULLSCREEN = "SET_PLAYER_FULLSCREEN",
	SET_PLAYER_VOLUME = "SET_PLAYER_VOLUME",
	SET_PLAYER_VOLUME_UP_BY_STEP = "SET_PLAYER_VOLUME_BY_STEP",
	SET_PLAYER_VOLUME_DOWN_BY_STEP = "SET_PLAYER_VOLUME_DOWN_STEP",
	SET_SEEKING = "SET_SEEKING",
	SET_SLIDER_SEEK = "SET_SLIDER_SEEK",
	SET_PROGRESS = "SET_PROGRESS",
	SET_HOVERING = "SET_HOVERING",
	TOGGLE_PLAYER_PLAYING = "TOGGLE_PLAYER_PLAYING",
	TOGGLE_PLAYER_FULLSCREEN = "TOGGLE_PLAYER_FULLSCREEN",
	TOGGLE_PLAYER_MUTED = "TOGGLE_PLAYER_MUTED",
}

export interface VideoPlayerAction {
	type: VideoPlayerActionKind;
	payload?: number | boolean | React.RefObject<HTMLVideoElement>;
}

const reducer = (
	state: VideoPlayerState,
	action: VideoPlayerAction,
): VideoPlayerState => {
	switch (action.type) {
		case VideoPlayerActionKind.SET_PLAYER_REF:
			return {
				...state,
				ref: action.payload as unknown as React.RefObject<ReactPlayer | null>,
			};
		case VideoPlayerActionKind.SET_PLAYER_READY:
			return {
				...state,
				isPlayerReady: action.payload as boolean,
			};
		case VideoPlayerActionKind.SET_PLAYER_PLAYING:
			return {
				...state,
				isPlayerPlaying: action.payload as boolean,
			};
		case VideoPlayerActionKind.SET_PLAYER_MUTED:
			return {
				...state,
				isPlayerMuted: action.payload as boolean,
			};
		case VideoPlayerActionKind.SET_PLAYER_FULLSCREEN:
			return {
				...state,
				isPlayerFullscreen: action.payload as boolean,
			};
		case VideoPlayerActionKind.SET_PLAYER_VOLUME:
			return {
				...state,
				playerVolume: action.payload as number,
			};
		case VideoPlayerActionKind.SET_SEEKING:
			return {
				...state,
				isSeeking: action.payload as boolean,
			};
		case VideoPlayerActionKind.SET_SLIDER_SEEK:
			return {
				...state,
				sliderSeek: action.payload as number,
			};
		case VideoPlayerActionKind.SET_PROGRESS:
			return {
				...state,
				progress: action.payload as number,
			};
		case VideoPlayerActionKind.SET_HOVERING:
			return {
				...state,
				isHovering: action.payload as boolean,
			};
		case VideoPlayerActionKind.TOGGLE_PLAYER_PLAYING:
			return {
				...state,
				isPlayerPlaying: !state.isPlayerPlaying,
			};
		case VideoPlayerActionKind.TOGGLE_PLAYER_FULLSCREEN: {
			WebviewWindow.getCurrent().setFullscreen(!state.isPlayerFullscreen);
			return {
				...state,
				isPlayerFullscreen: !state.isPlayerFullscreen,
			};
		}
		case VideoPlayerActionKind.TOGGLE_PLAYER_MUTED:
			return {
				...state,
				isPlayerMuted: !state.isPlayerMuted,
			};
		case VideoPlayerActionKind.SET_PLAYER_VOLUME_UP_BY_STEP:
			return {
				...state,
				playerVolume: Math.min(
					1,
					Math.max(0, state.playerVolume + (action.payload as number)),
				),
			};
		case VideoPlayerActionKind.SET_PLAYER_VOLUME_DOWN_BY_STEP:
			return {
				...state,
				playerVolume: Math.min(
					1,
					Math.max(0, state.playerVolume - (action.payload as number)),
				),
			};

		default:
			return state;
	}
};

export default reducer;
