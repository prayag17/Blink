/** @format */
import PropTypes from "prop-types";

import IconButton from "@mui/material/IconButton";

import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pink } from "@mui/material/colors";
import { MdiHeart } from "../icons/mdiHeart";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";
import { useSnackbar } from "notistack";
import { useAppLoadingStore } from "../../utils/store/appLoading";

const LikeButton = ({ itemId, isFavorite, queryKey, userId, itemName }) => {
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const [setIsLoading, setIsSuccess, setIsError] = useAppLoadingStore(
		(state) => [state.setIsLoading, state.setIsSuccess, state.setIsError],
	);

	const handleLiking = async () => {
		let result;
		console.log(isFavorite);
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
		onMutate: () => {
			setIsLoading(true);
			setIsError(false);
			setIsSuccess(false);

			queryClient.cancelQueries(queryKey);
			const currentLatestMedia = queryClient.getQueryData(queryKey);
			queryClient.setQueryData(queryKey, (oldMedia) => {
				try {
					oldMedia.Items.map((oitem) => {
						if (oitem.Id == itemId) {
							return {
								...oitem,
								UserData: {
									...oitem.UserData,
									IsFavorite: !isFavorite,
								},
							};
						}
						return oitem;
					});
				} catch (error) {
					oldMedia.map((oitem) => {
						if (oitem.Id == itemId) {
							return {
								...oitem,
								UserData: {
									...oitem.UserData,
									IsFavorite: !isFavorite,
								},
							};
						}
						return oitem;
					});
				}
			});
			return { currentLatestMedia };
		},
		onError: (error, a, context) => {
			setIsLoading(false);
			setIsError(true);
			enqueueSnackbar(
				`An error occured while updating "${itemName}"`,
				{
					variant: "error",
				},
			);
			queryClient.setQueryData(queryKey, context.previousData);
			console.error(error);
		},
		onSuccess: () => {
			setIsLoading(false);
			setIsSuccess(true);
			console.log("Successfully updated", itemId);
			queryClient.invalidateQueries(queryKey);
		},
	});
	return (
		<IconButton
			onClick={(e) => {
				e.stopPropagation();
				mutation.mutate();
			}}
			disabled={mutation.isLoading}
		>
			{isFavorite ? (
				<MdiHeart sx={{ color: pink[700] }} />
			) : (
				<MdiHeartOutline />
			)}
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
