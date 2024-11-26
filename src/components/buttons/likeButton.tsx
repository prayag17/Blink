import React from "react";

import IconButton from "@mui/material/IconButton";

import { useApiInContext } from "@/utils/store/api";
import type { UserItemDataDto } from "@jellyfin/sdk/lib/generated-client";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { pink } from "@mui/material/colors";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

export default function LikeButton({
	itemId,
	isFavorite,
	queryKey,
	userId,
	itemName,
}: {
	itemId: string | undefined;
	isFavorite: boolean | undefined;
	queryKey: string[] | undefined;
	userId: string | undefined;
	itemName?: string | null;
}) {
	const api = useApiInContext((s) => s.api);
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const handleLiking = async () => {
		let result: UserItemDataDto = null!;
		if (!api) return;
		if (!userId) return;
		if (!itemId) return;
		if (!itemName) return;
		if (isFavorite) {
			result = (
				await getUserLibraryApi(api).unmarkFavoriteItem({
					userId: userId,
					itemId: itemId,
				})
			).data;
		} else if (!isFavorite) {
			result = (
				await getUserLibraryApi(api).markFavoriteItem({
					userId: userId,
					itemId: itemId,
				})
			).data;
		}
		return result; // We need to return the result so that the onSettled function can invalidate the query
	};
	const mutation = useMutation({
		mutationFn: handleLiking,
		onError: (error) => {
			enqueueSnackbar(`An error occured while updating "${itemName}"`, {
				variant: "error",
			});
			console.error(error);
		},
		onSettled: async () => {
			return await queryClient.invalidateQueries({
				queryKey,
			});
		},
		mutationKey: ["likeButton", itemId],
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
				style={
					isFavorite
						? {
								//@ts-ignore
								"--fill": mutation.isPending ? 0 : 1,
								color: mutation.isPending ? "white" : pink.A700,
							}
						: {
								//@ts-ignore
								"--fill": mutation.isPending ? 1 : 0,
								color: mutation.isPending ? pink.A700 : "white",
							}
				}
			>
				favorite
			</div>
		</IconButton>
	);
}
