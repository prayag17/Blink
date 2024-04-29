import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { IconButton } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { useApi } from "src/utils/store/api";
import { playItemFromQueue } from "src/utils/store/playback";
import useQueue from "src/utils/store/queue";

const PlayPreviousButton = () => {
	const [api] = useApi((state) => [state.api]);
	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const result = await getUserApi(api).getCurrentUser();
			return result.data;
		},
	});
	const handlePlayNext = useMutation({
		mutationKey: ["playPreviousButton"],
		mutationFn: () => playItemFromQueue("previous", user.data?.Id),
		onError: (error) => [console.error(error)],
	});
	const [queueItems, currentItemIndex] = useQueue((state) => [
		state.tracks,
		state.currentItemIndex,
	]);
	return (
		<IconButton
			disabled={currentItemIndex === 0}
			onClick={() => handlePlayNext.mutate()}
		>
			<span className="material-symbols-rounded">skip_previous</span>
		</IconButton>
	);
};

export default PlayPreviousButton;