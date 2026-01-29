import { LoadingButton } from "@mui/lab";
import {
	Box,
	Button,
	Dialog,
	InputBase,
	Stack,
	Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import React, { useState } from "react";
import { setServer } from "@/utils/storage/servers";
import { jellyfin } from "@/utils/store/api";

type AddServerDialogProps = {
	open: boolean;
	setAddServerDialog: (value: boolean) => void;
	sideEffect?: () => Promise<unknown>;
	hideBackdrop?: boolean;
};

export default function AddServerDialog(props: AddServerDialogProps) {
	const { open, setAddServerDialog, sideEffect, hideBackdrop } = props;

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
					"Client added successfully. You might need to refresh client list.",
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
				enqueueSnackbar("Provided server address is not a Jellyfin server.", {
					variant: "error",
				});
			}
		},
	});

	return (
		<Dialog
			open={open}
			onClose={() => setAddServerDialog(false)}
			hideBackdrop={Boolean(hideBackdrop)}
			fullWidth
			maxWidth="sm"
			disableScrollLock={true}
			PaperProps={{
				sx: {
					backgroundColor: "rgba(20, 20, 30, 0.7)",
					backdropFilter: "blur(24px) saturate(180%)",
					backgroundImage:
						"linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
					borderRadius: 4,
					overflow: "hidden",
				},
			}}
		>
			<Stack p={4} spacing={3}>
				<Stack spacing={1} alignItems="center">
					<span
						className="material-symbols-rounded"
						style={{
							fontSize: "48px",
							color: "var(--mui-palette-primary-main)",
						}}
					>
						add_to_queue
					</span>
					<Typography variant="h5" fontWeight="bold" textAlign="center">
						Connect to Server
					</Typography>
					<Typography variant="body2" color="text.secondary" textAlign="center">
						Enter your Jellyfin server address to continue
					</Typography>
				</Stack>

				<Box
					sx={{
						p: "2px 16px",
						bgcolor: "rgba(0,0,0,0.2)",
						borderRadius: 2,
						border: "1px solid",
						borderColor: "rgba(255,255,255,0.05)",
						display: "flex",
						alignItems: "center",
						gap: 2,
						"&:focus-within": {
							borderColor: "var(--mui-palette-primary-main)",
							bgcolor: "rgba(0,0,0,0.3)",
						},
						transition: "border-color 0.2s, background-color 0.2s",
					}}
				>
					<span className="material-symbols-rounded" style={{ opacity: 0.5 }}>
						dns
					</span>
					<InputBase
						placeholder="https://jellyfin.example.com"
						fullWidth
						value={serverIp}
						onChange={(e) => setServerIp(e.target.value)}
						sx={{ py: 1.5 }}
						autoFocus
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								addServer.mutate();
							}
						}}
					/>
				</Box>

				<Stack direction="row" spacing={2} justifyContent="flex-end" pt={1}>
					<Button
						onClick={() => setAddServerDialog(false)}
						color="inherit"
						variant="text"
						sx={{ borderRadius: 2 }}
					>
						Cancel
					</Button>
					<LoadingButton
						loading={addServer.isPending}
						onClick={() => addServer.mutate()}
						variant="contained"
						color="primary"
						sx={{ borderRadius: 2, px: 3 }}
						disabled={!serverIp}
					>
						Connect
					</LoadingButton>
				</Stack>
			</Stack>
		</Dialog>
	);
}