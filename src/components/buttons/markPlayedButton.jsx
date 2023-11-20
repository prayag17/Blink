/** @format */
import PropTypes from "prop-types";

import React from "react";

import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { green } from "@mui/material/colors";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { MdiCheck } from "../icons/mdiCheck";
import { useSnackbar } from "notistack";
import { useApi } from "../../utils/store/api";

const MarkPlayedButton = ({ itemId, isPlayed, queryKey, userId, itemName }) => {
	const [api] = useApi((state) => [state.api]);

	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const handleMarking = async () => {
		if (!isPlayed) {
			await getPlaystateApi(api).markPlayedItem({
				userId: userId,
				itemId: itemId,
			});
		} else if (isPlayed) {
			await getPlaystateApi(api).markUnplayedItem({
				userId: userId,
				itemId: itemId,
			});
		}
	};
	const mutation = useMutation({
		mutationFn: handleMarking,
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
		mutationKey: ["markPlayedButton", itemId],
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
					style={{
						color: isPlayed ? green[400] : "white",
					}}
				>
					done
				</div>
			</IconButton>
		</div>
	);
};

MarkPlayedButton.propTypes = {
	itemId: PropTypes.string.isRequired,
	isPlayed: PropTypes.bool.isRequired,
	queryKey: PropTypes.any.isRequired,
	userId: PropTypes.string.isRequired,
};

export default MarkPlayedButton;
