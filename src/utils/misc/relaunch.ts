import { relaunch } from "@tauri-apps/api/process";

export const handleRelaunch = async (_event: unknown, reason?: string) => {
	if (reason && reason === "backdropClick") {
		return;
	}
	await relaunch();
};
