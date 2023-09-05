/** @format */
import PropTypes from "prop-types";

import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { green } from "@mui/material/colors";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { MdiCheck } from "../icons/mdiCheck";
import { useSnackbar } from "notistack";
import { useAppLoadingStore } from "../../utils/store/appLoading";

const MarkPlayedButton = ({ itemId, isPlayed, queryKey, userId, itemName }) => {
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const [setIsLoading, setIsSuccess, setIsError] = useAppLoadingStore(
		(state) => [state.setIsLoading, state.setIsSuccess, state.setIsError],
	);

	const handleMarking = async () => {
		if (!isPlayed) {
			await getPlaystateApi(window.api).markPlayedItem({
				userId: userId,
				itemId: itemId,
			});
		} else if (isPlayed) {
			await getPlaystateApi(window.api).markUnplayedItem({
				userId: userId,
				itemId: itemId,
			});
		}
	};
	const mutation = useMutation({
		mutationFn: handleMarking,
		onMutate: () => {
			setIsLoading(true);
			setIsError(false);
			setIsSuccess(false);
			queryClient.cancelQueries(queryKey);
			const previousData = queryClient.getQueryData(queryKey);
			queryClient.setQueryData(queryKey, (oldMedia) => {
				try {
					oldMedia.Items.map((oitem) => {
						if (oitem.Id == itemId) {
							return {
								...oitem,
								UserData: {
									...oitem.UserData,
									Played: !isPlayed,
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
									Played: !isPlayed,
								},
							};
						}
						return oitem;
					});
				}
			});
			return { previousData };
		},
		onError: (error, a, context) => {
			enqueueSnackbar(
				`An error occured while updating "${itemName}"`,
				{
					variant: "error",
				},
			);
			queryClient.setQueryData(queryKey, context.previousData);
			console.error(error);
			setIsError(true);
		},
		onSuccess: () => {
			console.log("Successfully updated", itemId);
			queryClient.invalidateQueries(queryKey);
			setIsSuccess(true);
		},
		onSettled: () => {
			setIsLoading(false);
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
			<MdiCheck
				sx={{
					color: isPlayed ? green[400] : "white",
				}}
			/>
		</IconButton>
	);
};

MarkPlayedButton.propTypes = {
	itemId: PropTypes.string.isRequired,
	isPlayed: PropTypes.bool.isRequired,
	queryKey: PropTypes.any.isRequired,
	userId: PropTypes.string.isRequired,
};

export default MarkPlayedButton;
