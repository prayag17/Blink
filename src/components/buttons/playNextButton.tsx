import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { IconButton } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { useApiInContext } from "@/utils/store/api";
import { playItemFromQueue } from "@/utils/store/playback";
import useQueue, { getNextTrackIndex } from "@/utils/store/queue";

const PlayNextButton = () => {
	const api = useApiInContext((s) => s.api);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			if (!api) return;
			const result = await getUserApi(api).getCurrentUser();
			return result.data;
		},
	});
	const handlePlayNext = useMutation({
		mutationKey: ["playNextButton"],
		mutationFn: async () => {
			const nextIndex = getNextTrackIndex();
			if (nextIndex === undefined) return;
			return playItemFromQueue(nextIndex, user.data?.Id, api);
		},
		onError: (error) => console.error(error),
	});
	// Re-render when the queue position or repeat mode changes.
	useQueue((state) => [state.tracks, state.currentItemIndex, state.repeatMode]);
	const hasNext = getNextTrackIndex() !== undefined;
	return (
		<IconButton disabled={!hasNext} onClick={() => handlePlayNext.mutate()}>
			<span className="material-symbols-rounded">skip_next</span>
		</IconButton>
	);
};

export default PlayNextButton;
