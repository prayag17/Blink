import { LoadingButton } from "@mui/lab";
import {
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Link,
} from "@mui/material";
import { relaunch } from "@tauri-apps/plugin-process";
import { type Update, check } from "@tauri-apps/plugin-updater";
import { useSnackbar } from "notistack";
import React, { useLayoutEffect, useState } from "react";

export default function Updater() {
	const [updateDialog, setUpdateDialog] = useState(false);
	const [updateDialogButton, setUpdateDialogButton] = useState(false);
	const [updateInfo, setUpdateInfo] = useState<Update | undefined>(undefined);

	useLayoutEffect(() => {
		async function checkForUpdates() {
			try {
				const update = await check();

				if (update?.available) {
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

	if (!updateInfo) return null;
	return (
		<Dialog
			open={updateDialog}
			maxWidth="xs"
			PaperProps={{
				style: {
					borderRadius: "20px",
				},
				className: "glass",
			}}
			sx={{
				"& img": {
					width: "100%",
				},
			}}
		>
			<DialogTitle variant="h5" align="center" textAlign={"center"}>
				Update Available!
			</DialogTitle>
			<DialogContent
				className="flex flex-center"
				style={{ gap: "0.5em", padding: "0 2em 1em 2em", flexWrap: "wrap" }}
			>
				<Chip
					icon={<span className="material-symbols-rounded">update</span>}
					label={`v${updateInfo.currentVersion}`}
					variant="outlined"
				/>
				<span className="material-symbols-rounded">arrow_right_alt</span>
				<Chip
					icon={<span className="material-symbols-rounded">update</span>}
					label={`v${updateInfo.version}`}
					variant="outlined"
				/>
				<DialogContentText sx={{ width: "100%" }}>
					<Link
						href={`https://github.com/prayag17/Blink/releases/v${updateInfo.version}`}
						target="_blank"
					>
						Open changelog
					</Link>
				</DialogContentText>
			</DialogContent>

			<DialogActions
				style={{
					padding: "1em",
				}}
				className="flex flex-center"
			>
				{/* <Button
							variant="outlined"
							//@ts-ignore
							color="white"
							disabled={updateDialogButton}
							onClick={() => setUpdateDialog(false)}
						>
							changelog
						</Button> */}
				<Button
					color="error"
					variant="contained"
					disabled={updateDialogButton}
					onClick={() => setUpdateDialog(false)}
					style={{ borderRadius: "10px" }}
					disableElevation
				>
					close
				</Button>
				<LoadingButton
					style={{ borderRadius: "10px" }}
					color="success"
					variant="contained"
					loading={updateDialogButton}
					loadingIndicator="Updating..."
					disableElevation
					onClick={async () => {
						setUpdateDialogButton(true);
						await updateInfo.downloadAndInstall();
						enqueueSnackbar("Update has been installed! You need to relaunch Blink.", {
							variant: "success",
						});
						await relaunch();
					}}
				>
					Update
				</LoadingButton>
			</DialogActions>
		</Dialog>
	);
}