/** @format */
import PropTypes from "prop-types";

import { useEffect } from "react";

import IconButton from "@mui/material/IconButton";

import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pink } from "@mui/material/colors";
import { MdiHeart } from "../icons/mdiHeart";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";
import { useSnackbar } from "notistack";
import CircularProgress from "@mui/material/CircularProgress";

const LikeButton = ({
	itemId,
	isFavorite,
	queryKey,
	userId,
	itemName,
	color = "white",
}) => {
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const handleLiking = async () => {
		let result;
		if (isFavorite) {
			result = await getUserLibraryApi(window.api).unmarkFavoriteItem({
				userId: userId,
				itemId: itemId,
			});
		} else if (!isFavorite) {
			result = await getUserLibraryApi(window.api).markFavoriteItem({
				userId: userId,
				itemId: itemId,
			});
		}
	};
	const mutation = useMutation({
		mutationFn: handleLiking,
		onError: (error, a, context) => {
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
					opacity: mutation.isLoading ? 1 : 0,
					transition: "opacity 200ms",
				}}
			/>
			<IconButton
				onClick={(e) => {
					if (!mutation.isLoading) {
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
					opacity: mutation.isLoading ? 0.5 : 1,
				}}
			>
				{isFavorite ? (
					<MdiHeart sx={{ color: pink[700] }} />
				) : (
					<MdiHeartOutline sx={{ color: color }} />
				)}
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
