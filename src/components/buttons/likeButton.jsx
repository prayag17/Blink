import PropTypes from "prop-types";

import React, { useEffect } from "react";

import IconButton from "@mui/material/IconButton";

import { useApiInContext } from "@/utils/store/api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import CircularProgress from "@mui/material/CircularProgress";
import { pink } from "@mui/material/colors";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useSnackbar } from "notistack";

const LikeButton = ({ itemId, isFavorite, queryKey, userId, itemName }) => {
	const api = useApiInContext((s) => s.api);
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const handleLiking = async () => {
		let result = null;
		if (isFavorite) {
			result = await getUserLibraryApi(api).unmarkFavoriteItem({
				userId: userId,
				itemId: itemId,
			});
		} else if (!isFavorite) {
			result = await getUserLibraryApi(api).markFavoriteItem({
				userId: userId,
				itemId: itemId,
			});
		}
		return result.data;
	};
	const mutation = useMutation({
		// mutationFn: async () => {
		// 	new Promise((resolve, reject) => {
		// 		setTimeout(() => {
		// 			resolve("foo");
		// 		}, 4000);
		// 	});
		// },
		mutationFn: handleLiking,
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
								"--fill": mutation.isPending ? 0 : 1,
								color: mutation.isPending ? "white" : pink.A700,
						  }
						: {
								"--fill": mutation.isPending ? 1 : 0,
								color: mutation.isPending ? pink.A700 : "white",
						  }
				}
			>
				favorite
			</div>
		</IconButton>
	);
};

LikeButton.propTypes = {
	itemId: PropTypes.string.isRequired,
	isFavorite: PropTypes.bool.isRequired,
	queryKey: PropTypes.any.isRequired,
	userId: PropTypes.string.isRequired,
	itemName: PropTypes.string,
};

export default LikeButton;
