import { useApiInContext } from "@/utils/store/api";
import { playItemFromQueue } from "@/utils/store/playback";
import useQueue from "@/utils/store/queue";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { IconButton } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";

const PlayPreviousButton = () => {
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
		mutationKey: ["playPreviousButton"],
		mutationFn: () => playItemFromQueue("previous", user.data?.Id, api),
		onError: (error) => [console.error(error)],
	});
	const [currentItemIndex] = useQueue((state) => [state.currentItemIndex]);
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