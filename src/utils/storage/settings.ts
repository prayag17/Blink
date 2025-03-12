import { load } from "@tauri-apps/plugin-store";

const SettingsStore = await load(".settings.dat", { autoSave: true });

/**
 * settingKey should be of type:
 * 'settingDomain.settingKeyName'
 */

export const setSetting = async (settingKey: string, value: boolean) => {
	await SettingsStore.set(settingKey, value);
	await SettingsStore.save();
};

export const getSetting = async (settingKey: string) => {
	const value = await SettingsStore.get(settingKey);
	console.log(`${settingKey} - ${value}`);
	if (value) return value;
	return false;
};

export const allSettings = {
	general: [
		{
			key: "general.enable_skip_intro_outro",
			name: "Enable Intro-Skipper plugin",
			description:
				"Shows a skip button for Intros and End Credit scenes in an episode. Note: this requires jumoog/intro-skipper plugin to be installed on server",
		},
	],
	downloads: [
		{
		  key: "showOfflineContent",
		  type: "boolean",
		  defaultValue: true,
		  label: "Show offline content when disconnected",
		  description: "When enabled, downloaded content will be available in offline mode"
		},
		{
		  key: "autoDeleteWatched",
		  type: "boolean",
		  defaultValue: false,
		  label: "Auto-delete watched content",
		  description: "Automatically remove downloads after you've finished watching them"
		}
	],
};