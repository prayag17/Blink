import { load } from "@tauri-apps/plugin-store";

const PlayerStore = await load(".player.dat", { autoSave: true });

export const setPlayerVolume = async (type: "audio" | "video", volume: number) => {
	await PlayerStore.set(`${type}.volume`, volume);
	await PlayerStore.save();
};

export const getPlayerVolume = async (type: "audio" | "video") => {
	const value = await PlayerStore.get<number>(`${type}.volume`);
	return value ?? 0.8;
};

export const setPlayerMuted = async (type: "audio" | "video", muted: boolean) => {
	await PlayerStore.set(`${type}.muted`, muted);
	await PlayerStore.save();
};

export const getPlayerMuted = async (type: "audio" | "video") => {
	const value = await PlayerStore.get<boolean>(`${type}.muted`);
	return value ?? false;
};
