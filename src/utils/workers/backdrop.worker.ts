import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";

let intervalId: number | undefined;
let backdropItems: BaseItemDto[] = [];
let backdropIndex = 0;

const updateBackdrop = () => {
	if (backdropItems.length === 0) {
		return;
	}

	backdropIndex = (backdropIndex + 1) % backdropItems.length;
	const item = backdropItems[backdropIndex];
	const keys = Object.keys(item?.ImageBlurHashes?.Backdrop ?? {});
	const nextHash = item?.ImageBlurHashes?.Backdrop?.[keys[0]];

	if (nextHash) {
		self.postMessage({ type: "UPDATE_BACKDROP", payload: nextHash });
	}
};

self.onmessage = (event: MessageEvent) => {
	const { type, payload } = event.data;

	switch (type) {
		case "SET_BACKDROP_ITEMS":
			backdropItems = payload;
			backdropIndex = 0;
			if (backdropItems.length > 0) {
				const firstBackdrop = backdropItems[0];
				const firstKey = Object.keys(
					firstBackdrop?.ImageBlurHashes?.Backdrop ?? {},
				)[0];
				const initialHash =
					firstBackdrop?.ImageBlurHashes?.Backdrop?.[firstKey];
				if (initialHash) {
					self.postMessage({ type: "UPDATE_BACKDROP", payload: initialHash });
				}
			}
			break;
		case "START":
			if (intervalId) {
				clearInterval(intervalId);
			}
			intervalId = self.setInterval(updateBackdrop, 10_000);
			break;
		case "STOP":
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = undefined;
			}
			break;
		default:
			console.warn("Unknown message type in backdrop worker:", type);
	}
};
