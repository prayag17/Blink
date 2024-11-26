import React from "react";

import IconButton from "@mui/material/IconButton";

import { green } from "@mui/material/colors";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiInContext } from "@/utils/store/api";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { useSnackbar } from "notistack";

export default function MarkPlayedButton({
	itemId,
	isPlayed,
	queryKey,
	userId,
	itemName,
}: {
	itemId?: string;
	isPlayed?: boolean;
	queryKey?: string[];
	userId?: string;
	itemName?: string | null;
}) {
	const api = useApiInContext((s) => s.api);

	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const handleMarking = async () => {
		let result = null;
		if (!api) return;
		if (!api) return;
		if (!userId) return;
		if (!itemId) return;
		if (!itemName) return;

		if (!isPlayed) {
			result = await getPlaystateApi(api).markPlayedItem({
				userId: userId,
				itemId: itemId,
			});
		} else if (isPlayed) {
			result = await getPlaystateApi(api).markUnplayedItem({
				userId: userId,
				itemId: itemId,
			});
		}
		return result; // We need to return the result so that the onSettled function can invalidate the query
	};
	const mutation = useMutation({
		mutationFn: handleMarking,
		onError: (error) => {
			enqueueSnackbar(`${error}`, {
				variant: "error",
			});
			enqueueSnackbar(`An error occured while updating "${itemName}"`, {
				variant: "error",
			});
			console.error(error);
		},
		onSettled: async () => {
			return await queryClient.invalidateQueries({
				queryKey: queryKey,
			});
		},
		mutationKey: ["markPlayedButton", itemId],
	});
	return (
		<IconButton
			onClick={(e) => {
				if (!mutation.isPending) {
					mutation.mutate();
					e.stopPropagation();
				}
			}}
			style={{
				opacity: mutation.isPending ? 0.5 : 1,
				transition: "opacity 250ms",
			}}
		>
			<div
				className="material-symbols-rounded"
				style={{
					color: isPlayed
						? mutation.isPending
							? "white"
							: green.A700
						: mutation.isPending
							? green.A700
							: "white",
				}}
			>
				done
			</div>
		</IconButton>
	);
}
