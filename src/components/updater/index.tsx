import { LoadingButton } from "@mui/lab";
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	Stack,
	Typography,
} from "@mui/material";
import { relaunch } from "@tauri-apps/plugin-process";
import { open } from "@tauri-apps/plugin-shell";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useSnackbar } from "notistack";
import React, { useCallback, useLayoutEffect, useState } from "react";

export default function Updater() {
	const [updateDialog, setUpdateDialog] = useState(false);
	const [updateDialogButton, setUpdateDialogButton] = useState(false);
	const [updateInfo, setUpdateInfo] = useState<Update | undefined>(undefined);

	useLayoutEffect(() => {
		async function checkForUpdates() {
			try {
				const update = await check();
				if (update) {
					// console.log(update);
					setUpdateInfo(update);
					setUpdateDialog(true);

					console.info(`Update found : ${update.version}, ${update.date}`);
				}
			} catch (error) {
				console.error(error);
			}
		}
		checkForUpdates();
	}, []);
	const { enqueueSnackbar } = useSnackbar();
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [downloadSize, setDownloadSize] = useState(0);
	const handleUpdate = useCallback(async () => {
		try {
			setUpdateDialogButton(true);
			await updateInfo?.downloadAndInstall((e) => {
				switch (e.event) {
					case "Started":
						setDownloadSize(e.data.contentLength ?? 0);
						break;
					case "Progress":
						setDownloadProgress((s) => s + e.data.chunkLength);
						break;
					case "Finished":
						setDownloadProgress(downloadSize);
						break;
				}
			});
			enqueueSnackbar(
				"Update has been installed! You need to relaunch Blink.",
				{
					variant: "success",
				},
			);
			await relaunch();
		} catch (error) {
			console.error(error);
			enqueueSnackbar(`Failed to update Blink. ${error}`, { variant: "error" });
		}
		setUpdateDialogButton(false);
	}, [enqueueSnackbar, updateInfo, downloadSize]);

	if (!updateInfo) return null;

	return (
		<Dialog
			open={updateDialog}
			maxWidth="xs"
			fullWidth
			slotProps={{
				paper: {
					className: "glass",
					style: {
						borderRadius: "24px",
						overflow: "hidden",
					},
				},
				backdrop: {
					style: {
						backdropFilter: "blur(5px)",
						backgroundColor: "rgba(0, 0, 0, 0.5)",
					},
				},
			}}
		>
			<Box
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "140px",
					opacity: 0.5,
					background: (theme) =>
						`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
					zIndex: 0,
					filter: "blur(40px)",
					transform: "translateY(-50%) scale(1.5)",
				}}
			/>

			<DialogContent
				sx={{ position: "relative", zIndex: 1, pt: 5, pb: 3, px: 3 }}
			>
				<Stack alignItems="center" spacing={3}>
					<Box
						sx={{
							width: 72,
							height: 72,
							borderRadius: "50%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: (theme) =>
								`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
							boxShadow: (theme) =>
								`0 10px 25px -5px ${theme.palette.primary.main}80`,
							mb: 1,
						}}
					>
						<span
							className="material-symbols-rounded"
							style={{ fontSize: "36px", color: "white" }}
						>
							rocket_launch
						</span>
					</Box>

					<Stack spacing={1} textAlign="center">
						<Typography
							variant="h5"
							fontWeight="900"
							sx={{
								background: (theme) =>
									`linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
								backgroundClip: "text",
								WebkitBackgroundClip: "text",
								color: "transparent",
							}}
						>
							Update Available
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ maxWidth: "25ch" }}
						>
							A new version of Blink is ready for you.
						</Typography>
					</Stack>

					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
						sx={{
							width: "100%",
							bgcolor: "rgba(255,255,255,0.03)",
							borderRadius: 4,
							p: 2.5,
							border: "1px solid rgba(255,255,255,0.05)",
						}}
					>
						<Stack>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ mb: 0.5 }}
							>
								Current
							</Typography>
							<Typography variant="subtitle1" fontWeight="bold">
								v{updateInfo.currentVersion}
							</Typography>
						</Stack>

						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: 32,
								height: 32,
								borderRadius: "50%",
								bgcolor: "rgba(255,255,255,0.05)",
							}}
						>
							<span
								className="material-symbols-rounded"
								style={{
									fontSize: "16px",
									color: "rgba(255,255,255,0.5)",
								}}
							>
								arrow_forward
							</span>
						</Box>

						<Stack alignItems="flex-end">
							<Typography
								variant="caption"
								color="primary.main"
								sx={{ mb: 0.5 }}
							>
								New Version
							</Typography>
							<Typography
								variant="subtitle1"
								fontWeight="bold"
								color="primary.main"
							>
								v{updateInfo.version}
							</Typography>
						</Stack>
					</Stack>

					<Button
						onClick={() =>
							open(
								`https://github.com/prayag17/Blink/releases/v${updateInfo.version}`,
							)
						}
						size="small"
						sx={{
							textTransform: "none",
							cursor: "pointer",
							color: "text.secondary",
							borderRadius: "100px",
							px: 2,
							"&:hover": {
								color: "primary.main",
								bgcolor: "rgba(255,255,255,0.05)",
							},
						}}
						endIcon={
							<span
								className="material-symbols-rounded"
								style={{ fontSize: 16 }}
							>
								open_in_new
							</span>
						}
					>
						See what's new
					</Button>
				</Stack>
			</DialogContent>

			<DialogActions
				sx={{
					p: 3,
					pt: 0,
					justifyContent: "space-between",
					gap: 1.5,
				}}
			>
				<Button
					color="inherit"
					size="large"
					onClick={() => setUpdateDialog(false)}
					sx={{
						borderRadius: "14px",
						flex: 1,
						color: "text.secondary",
						height: 48,
						"&:hover": {
							bgcolor: "rgba(255,255,255,0.05)",
							color: "text.primary",
						},
					}}
				>
					Later
				</Button>
				<Button
					size="large"
					variant="contained"
					loading={updateDialogButton}
					loadingIndicator={
						<CircularProgress
							size={24}
							color="inherit"
							value={downloadProgress / downloadSize}
						/>
					}
					disableElevation
					onClick={handleUpdate}
					sx={{
						borderRadius: "14px",
						flex: 1,
						height: 48,
						background: (theme) =>
							`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
						boxShadow: (theme) =>
							`0 8px 20px -5px ${theme.palette.primary.main}60`,
						"&:hover": {
							background: (theme) =>
								`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
							opacity: 0.9,
							boxShadow: (theme) =>
								`0 12px 25px -5px ${theme.palette.primary.main}80`,
						},
					}}
				>
					Update
				</Button>
			</DialogActions>
		</Dialog>
	);
}