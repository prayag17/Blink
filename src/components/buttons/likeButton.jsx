/** @format */
import PropTypes from "prop-types";

import React from "react";

import IconButton from "@mui/material/IconButton";

import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pink } from "@mui/material/colors";
import { MdiHeart } from "../icons/mdiHeart";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";
import { useSnackbar } from "notistack";
import CircularProgress from "@mui/material/CircularProgress";

import { useApi } from "../../utils/store/api";

const LikeButton = ({ itemId, isFavorite, queryKey, userId, itemName }) => {
	const [api] = useApi((state) => [state.api]);
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const handleLiking = async () => {
		if (isFavorite) {
			await getUserLibraryApi(api).unmarkFavoriteItem({
				userId: userId,
				itemId: itemId,
			});
		} else if (!isFavorite) {
			await getUserLibraryApi(api).markFavoriteItem({
				userId: userId,
				itemId: itemId,
			});
		}
	};
	const mutation = useMutation({
		mutationFn: handleLiking,
		onError: (error) => {
			enqueueSnackbar(`${error}`, {
				variant: "error",
			});
			enqueueSnackbar(
				`An error occured while updating "${itemName}"`,
				{
					variant: "error",
				},
			);
			console.error(error);
		},
		onSettled: async () => {
			return await queryClient.invalidateQueries({
				queryKey: queryKey,
			});
		},
		mutationKey: ["likeButton", itemId],
	});

	return (
		<div
			style={{
				transition: "opacity 250ms",
				position: "relative",
				display: "inline-flex",
			}}
		>
			<CircularProgress
				style={{
					opacity: mutation.isPending ? 1 : 0,
					transition: "opacity 200ms",
				}}
				thickness={2}
			/>
			<IconButton
				onClick={(e) => {
					if (!mutation.isPending) {
						e.stopPropagation();
						mutation.mutate();
					}
				}}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					opacity: mutation.isPending ? 0.5 : 1,
				}}
			>
				<div
					className="material-symbols-rounded"
					style={
						isFavorite
							? {
									fontVariationSettings:
										'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
									color: pink[700],
							  }
							: {
									fontVariationSettings:
										'"FILL" 0, "wght" 300, "GRAD" 25, "opsz" 40',
									color: "white",
							  }
					}
				>
					favorite
				</div>
			</IconButton>
		</div>
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
