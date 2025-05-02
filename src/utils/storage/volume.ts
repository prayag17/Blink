import { load } from "@tauri-apps/plugin-store";

const store = await load(".audio-settings.dat", { autoSave: true });

async function getVolume(): Promise<number> {
  const val = await store.get<number>("volume");
  return typeof val === "number" ? val : 0.8;
}

async function setVolume(volume: number): Promise<void> {
  await store.set("volume", volume);
  await store.save();
}

async function getMuted(): Promise<boolean> {
  const val = await store.get<boolean>("muted");
  return typeof val === "boolean" ? val : false;
}

async function setIsMuted(muted: boolean): Promise<void> {
  await store.set("muted", muted);
  await store.save();
}

export { getVolume, setVolume, getMuted, setIsMuted };
