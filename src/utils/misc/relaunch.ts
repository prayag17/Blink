import { relaunch } from "@tauri-apps/plugin-process";

export const handleRelaunch = async (_event: unknown, reason?: string) => {
	if (reason && reason === "backdropClick") {
		return;
	}
	await relaunch();
};
