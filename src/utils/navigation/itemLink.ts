import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { linkOptions } from "@tanstack/react-router";

/**
 * Returns navigation options for an item's detail page.
 * Music items get their dedicated music pages, everything else goes to the unified
 * `/item/$id` page with the item type as a hint so the loader can prefetch in parallel.
 */
export const getItemLinkOptions = (
	id: string,
	type: BaseItemKind | null | undefined,
) => {
	switch (type) {
		case BaseItemKind.MusicAlbum:
			return linkOptions({ to: "/music/album/$id", params: { id } });
		case BaseItemKind.MusicArtist:
			return linkOptions({ to: "/music/artist/$id", params: { id } });
		case BaseItemKind.Playlist:
			return linkOptions({ to: "/music/playlist/$id", params: { id } });
		default:
			return linkOptions({
				to: "/item/$id",
				params: { id },
				search: { type: type ?? undefined },
			});
	}
};
