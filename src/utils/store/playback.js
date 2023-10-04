/** @format */

import { create } from "zustand";

export const usePlaybackStore = create((set) => ({
	url: "",
	startPosition: 0,
	duration: 0,
	itemId: "",
	itemName: "",
	subtitleTracks: [],
	selectedSubtitleTrack: 0,
	mediaSourceId: "",
	audioStreamIndex: 0,
	videoStreamIndex: 0,
	subtitleStreamIndex: 0,
	userId: "",
	mediaContainer: "",
	seriesId: "",
	queue: [],
	episodeIndex: 0,
	setUrl: (aurl) => set((state) => ({ ...state, url: aurl })),
	setPosition: (apos) => set((state) => ({ ...state, startPosition: apos })),
	setDuration: (adur) => set((state) => ({ ...state, duration: adur })),
	setItemId: (aid) => set((state) => ({ ...state, itemId: aid })),
	setItemName: (anm) => set((state) => ({ ...state, itemName: anm })),
	setUserId: (anm) => set((state) => ({ ...state, userId: anm })),
	setSeriesId: (anm) => set((state) => ({ ...state, seriesId: anm })),
	setMediaContainer: (anm) =>
		set((state) => ({ ...state, mediaContainer: anm })),
	setMediaSourceId: (anm) =>
		set((state) => ({ ...state, mediaSourceId: anm })),
	setAudioStreamIndex: (anm) =>
		set((state) => ({ ...state, audioStreamIndex: anm })),
	setVideoStreamIndex: (anm) =>
		set((state) => ({ ...state, videoStreamIndex: anm })),
	setSubtitleStreamIndex: (anm) =>
		set((state) => ({ ...state, subtitleStreamIndex: anm })),
	setSubtitleTracks: (asub) =>
		set((state) => ({
			...state,
			subtitleTracks: asub,
		})),
	setSelectedSubtitleTrack: (asub) =>
		set((state) => ({ ...state, selectedSubtitleTrack: asub })),
	setQueue: (qitem) => set((state) => ({ ...state, queue: qitem })),
	setEpisodeIndex: (aitem) =>
		set((state) => ({ ...state, episodeIndex: aitem })),
}));

export const usePlaybackDataLoadStore = create((set) => ({
	isLoading: false,
	setIsLoading: (loading) =>
		set((state) => ({
			...state,
			isLoading: loading,
		})),
}));
