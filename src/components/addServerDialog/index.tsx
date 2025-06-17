import { setServer } from "@/utils/storage/servers";
import { jellyfin } from "@/utils/store/api";
import { LoadingButton } from "@mui/lab";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

type AddServerDialogProps = {
	open: boolean;
	setAddServerDialog: (value: boolean) => void;
	sideEffect?: () => Promise<unknown>;
	hideBackdrop?: boolean;
};

export default function AddServerDialog(props: AddServerDialogProps) {
	const { open, setAddServerDialog, sideEffect, hideBackdrop } = props;
	const { t } = useTranslation();

	const [serverIp, setServerIp] = useState("");
	const addServer = useMutation({
		mutationKey: ["add-server"],
		mutationFn: async () => {
			const servers =
				await jellyfin.discovery.getRecommendedServerCandidates(serverIp);
			const bestServer = jellyfin.discovery.findBestServer(servers);
			return bestServer;
		},
		onSuccess: async (bestServer) => {
			if (bestServer) {
				await setServer(bestServer.systemInfo?.Id ?? "", bestServer);
				setAddServerDialog(false);
				enqueueSnackbar(
					t("settings.servers.success.client_added"),
					{
						variant: "success",
					},
				);
				if (sideEffect) {
					await sideEffect();
				}
			}
		},
		onError: (err) => {
			console.error(err);
			enqueueSnackbar(`${err}`, { variant: "error" });
			enqueueSnackbar("Something went wrong", { variant: "error" });
		},
		onSettled: async (bestServer) => {
			if (!bestServer) {
				enqueueSnackbar(t("settings.servers.errors.invalid_jellyfin_server"), {
					variant: "error",
				});
			}
		},
	});

	return (
		<Dialog
			open={open}
			hideBackdrop={Boolean(hideBackdrop)}
			fullWidth
			maxWidth="sm"
			disableScrollLock={true}
		>
			<DialogTitle variant="h4" align="center" mb={1}>
				{t("settings.servers.add_server")}
				Add Server
			</DialogTitle>
			<DialogContent className="settings-server-add">
				<TextField
					variant="filled"
					label="Address"
					fullWidth
					onChange={(e) => setServerIp(e.target.value)}
				/>
			</DialogContent>
			<DialogActions
				style={{
					alignItems: "center",
					justifyContent: "center",
					padding: "1em",
					gap: "1em",
				}}
			>
				<Button
					variant="contained"
					startIcon={
						<span
							className="material-symbols-rounded"
							style={{
								marginRight: "0.25em",
								fontVariationSettings:
									'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
							}}
						>
							cancel
						</span>
					}
					color="error"
					onClick={() => setAddServerDialog(false)}
				>
					{t("close")}
				</Button>
				{/* @ts-ignore */}
				<LoadingButton
					startIcon={
						<span
							className="material-symbols-rounded"
							style={{
								marginRight: "0.25em",
								fontVariationSettings:
									'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
							}}
						>
							add_circle
						</span>
					}
					variant="contained"
					loading={addServer.isPending}
					loadingPosition="start"
					onClick={addServer.mutate}
					color="success"
				>
					{t("add")}
				</LoadingButton>
			</DialogActions>
		</Dialog>
	);
}