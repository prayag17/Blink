/** @format */
import PropTypes from "prop-types";

import IconButton from "@mui/material/IconButton";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { green, pink } from "@mui/material/colors";
import { MdiHeart } from "../icons/mdiHeart";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { MdiCheck } from "../icons/mdiCheck";
import { useSnackbar } from "notistack";

const MarkPlayedButton = ({ itemId, isPlayed, queryKey, userId, itemName }) => {
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

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
			queryClient.cancelQueries(queryKey);
			const previousData = queryClient.getQueryData(queryKey);
			queryClient.setQueryData(queryKey, (oldMedia) =>
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
				}),
			);
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
		},
		onSuccess: () => {
			console.log("Successfully updated", itemId);
			queryClient.invalidateQueries(queryKey);
		},
	});
	return (
		<IconButton onClick={mutation.mutate}>
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
