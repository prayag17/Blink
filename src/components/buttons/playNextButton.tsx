import { useApiInContext } from "@/utils/store/api";
import { playItemFromQueue } from "@/utils/store/playback";
import useQueue from "@/utils/store/queue";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { IconButton } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import React from "react";

const PlayNextButton = () => {
	const api = useApiInContext((s) => s.api);
	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const result = await getUserApi(api).getCurrentUser();
			return result.data;
		},
	});
	const navigate = useNavigate();
	const handlePlayNext = useMutation({
		mutationKey: ["playNextButton"],
		mutationFn: () => playItemFromQueue("next", user.data?.Id, api),
		onError: (error) => [console.error(error)],
	});
	const [queueItems, currentItemIndex] = useQueue((state) => [
		state.tracks,
		state.currentItemIndex,
	]);
	return (
		<IconButton
			disabled={queueItems.length === currentItemIndex + 1}
			onClick={() => handlePlayNext.mutate()}
		>
			<span className="material-symbols-rounded">skip_next</span>
		</IconButton>
	);
};

export default PlayNextButton;