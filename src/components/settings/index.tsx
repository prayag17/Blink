import {
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Fab,
	FormControlLabel,
	IconButton,
	LinearProgress,
	Link,
	Skeleton,
	Switch,
	Tab,
	Tabs,
	TextField,
	Typography,
	styled,
	withStyles,
} from "@mui/material";
import { AnimatePresence, motion, transform } from "framer-motion";
import React, { useEffect, useState } from "react";
import useSettingsStore, {
	setSettingsDialogOpen,
	setSettingsTabValue,
} from "../../utils/store/settings";

import logo from "../../assets/logoBlack.png";

import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApi, useApi } from "../../utils/store/api";
import { useCentralStore } from "../../utils/store/central";
import "./settings.module.scss";

import { RecommendedServerInfo } from "@jellyfin/sdk";
import { LoadingButton } from "@mui/lab";
import { red, yellow } from "@mui/material/colors";
import { relaunch } from "@tauri-apps/api/process";
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { enqueueSnackbar, useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import {
	delServer,
	getAllServers,
	getDefaultServer,
	setDefaultServer,
	setServer,
} from "../../utils/storage/servers";
import { delUser } from "../../utils/storage/user";

const motionConfig = {
	initial: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
	},
};

const Settings = () => {
	const [open, tabValue] = useSettingsStore((state) => [
		state.dialogOpen,
		state.tabValue,
	]);
	const [api, jellyfin] = useApi((state) => [state.api, state.jellyfin]);
	const systemInfo = useQuery({
		queryKey: ["about", "systemInfo"],
		queryFn: async () => {
			const result = await getSystemApi(api).getSystemInfo();
			return result.data;
		},
		enabled: Boolean(api) && open,
	});

	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();

	const [applicationVersion, serversOnDiskFn] = useCentralStore((state) => [
		state.clientVersion,
		state.allServersOnDisk,
	]);

	const serversOnDisk = useQuery({
		queryKey: ["settings", "serversOnDisk"],
		queryFn: async () => await getAllServers(),
		enabled: open,
	});

	const updateInfo = useQuery({
		queryKey: ["about", "updater"],
		queryFn: async () => await checkUpdate(),
		enabled: open,
	});

	const defaultServer = useQuery({
		queryKey: ["settings", "default-server"],
		queryFn: async () => await getDefaultServer(),
		enabled: open,
	});

	const queryClient = useQueryClient();

	const [updating, setUpdating] = useState(false);
	const [serverState, setServerState] = useState();
	const [ask, setAsk] = useState(false);
	const [action, setAction] = useState(null);
	const [addServerDialog, setAddServerDialog] = useState(false);
	const [serverIp, setServerIp] = useState("");

	const handleServerChange = useMutation({
		mutationFn: async () => {
			await delUser();
			await setDefaultServer(serverState.id);
			await defaultServer.refetch();
			createApi(serverState.address, null);
			queryClient.removeQueries();
		},
		onSuccess: async () => {
			setAsk(false);
			setSettingsDialogOpen(false);
			navigate("/login/index");
		},
		onError: (error) => {
			console.error(error);
			enqueueSnackbar("Error changing the server", {
				variant: "error",
			});
		},
	});

	const handleDelete = async (server: RecommendedServerInfo) => {
		await delServer(server.id);

		if (server.id === defaultServer.data) {
			await delUser();
			await serversOnDisk.refetch();

			if (serversOnDisk.data.length > 0) {
				setDefaultServer(serversOnDisk.data[0].id);
				createApi(serversOnDisk.data[0].address, null);
			} else {
				// Reset Api as no server is present on disk
				useApi.setState(useApi.getInitialState());
			}
			setSettingsDialogOpen(false);
			queryClient.removeQueries();
			navigate("/");
		}
		enqueueSnackbar("Server deleted successfully!", { variant: "success" });
		setAsk(false);
		await serversOnDisk.refetch();
		await defaultServer.refetch();
	};

	const addServer = useMutation({
		mutationFn: async () => {
			const servers =
				await jellyfin.discovery.getRecommendedServerCandidates(serverIp);
			const bestServer = jellyfin.discovery.findBestServer(servers);
			return bestServer;
		},
		onSuccess: async (bestServer) => {
			if (bestServer) {
				await setServer(bestServer.systemInfo.Id, bestServer);
				setAddServerDialog(false);
				enqueueSnackbar(
					"Client added successfully. You might need to refresh client list.",
					{
						variant: "success",
					},
				);
				await serversOnDisk.refetch();
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
			fullWidth
			maxWidth="md"
			PaperProps={{
				className: "settings",
			}}
			onClose={() => setSettingsDialogOpen(false)}
		>
			<Tabs
				orientation="vertical"
				value={tabValue}
				onChange={(e, newValue) => {
					setSettingsTabValue(newValue);
				}}
				style={{
					borderRight: "1.2px solid rgb(255 255 255 / 0.1)",
				}}
			>
				<Tab
					icon={<span className="material-symbols-rounded">settings</span>}
					iconPosition="start"
					value={1}
					label="General"
					className="settings-tab"
					sx={{
						minHeight: "48px",
						height: "48px",
					}}
				/>
				<Tab
					icon={<span className="material-symbols-rounded">dns</span>}
					iconPosition="start"
					value={2}
					label="Servers"
					className="settings-tab"
					sx={{
						minHeight: "48px",
						height: "48px",
					}}
				/>
				<Tab
					icon={<span className="material-symbols-rounded">info</span>}
					iconPosition="start"
					value={10}
					label="About"
					className="settings-tab"
					sx={{
						minHeight: "48px",
						height: "48px",
						marginTop: "auto",
					}}
				/>
			</Tabs>
			<AnimatePresence mode="wait">
				<motion.div
					variants={motionConfig}
					initial="initial"
					animate="visible"
					exit="initial"
					key={tabValue}
					transition={{
						duration: 0.25,
					}}
					className="settings-scroll "
				>
					{/* General */}
					{tabValue === 1 && (
						<div className="settings-container">
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
							<FormControlLabel
								value="start"
								control={<Switch color="primary" />}
								label={
									<div className="settings-option-info">
										<Typography variant="h6" fontWeight={400}>
											Enable DiscordRPC
										</Typography>
										<Typography variant="subtitle2" fontWeight={200}>
											this a test
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
						</div>
					)}

					{/* Server */}
					{tabValue === 2 && (
						<motion.div
							layoutScroll
							className="settings-container settings-server-container"
						>
							{serversOnDisk.isSuccess &&
								serversOnDisk.data.map((server, index) => {
									return (
										<motion.div
											key={server.id}
											className="settings-server"
											initial={{
												transform: "translateY(10px)",
												opacity: 0,
											}}
											animate={{ transform: "translateY(0px)", opacity: 1 }}
											exit={{ transform: "translateY(-10px)", opacity: 1 }}
											transition={{
												delay: 0.1 * index,
												duration: 0.15,
											}}
										>
											<span className="material-symbols-rounded settings-server-icon">
												hard_drive
											</span>
											<div className="settings-server-info">
												<Typography
													variant="h5"
													style={{
														display: "flex",
														alignItems: "center",
													}}
												>
													{server.systemInfo?.ServerName}
													{systemInfo.data?.Id === server.id && (
														<Chip
															label={
																<Typography
																	variant="caption"
																	fontWeight={600}
																	fontFamily="JetBrains Mono Variable"
																>
																	Current
																</Typography>
															}
															color="info"
															sx={{
																ml: 2,
																width: "5.4em",
															}}
															size="medium"
														/>
													)}
												</Typography>
												<Typography variant="subtitle1">
													{server.address}
												</Typography>
												<Typography
													variant="subtitle2"
													className="settings-server-info-version"
												>
													Version:{" "}
													<Typography
														className="gradient-text"
														variant="subtitle2"
														fontWeight={700}
													>
														{server.systemInfo?.Version}
													</Typography>
												</Typography>
											</div>
											<div className="settings-buttons">
												<IconButton
													style={{
														fontSize: "1.64em",
													}}
													onClick={() => {
														setAsk(true);
														setAction("change-server");
														setServerState(server);
													}}
													disabled={handleServerChange.isPending}
												>
													<div className="material-symbols-rounded">start</div>
												</IconButton>
												<IconButton
													style={{
														fontSize: "1.64em",

														color: red[400],
													}}
													disabled={handleServerChange.isPending}
													onClick={() => {
														setAsk(true);
														setAction("delete-server");
														setServerState(server);
													}}
												>
													<div className="material-symbols-rounded">
														delete_forever
													</div>
												</IconButton>
											</div>
										</motion.div>
									);
								})}
							<div className="settings-server-fab-container">
								<Fab
									onClick={() => serversOnDisk.refetch()}
									size="medium"
									color="info"
									disabled={serversOnDisk.isFetching}
								>
									<span
										className={
											serversOnDisk.isFetching
												? "material-symbols-rounded animate-rotate"
												: "material-symbols-rounded"
										}
									>
										autorenew
									</span>
								</Fab>
								<Fab
									variant="extended"
									onClick={() => setAddServerDialog(true)}
								>
									<span
										className="material-symbols-rounded fill"
										style={{
											marginRight: "0.25em",
										}}
									>
										add_circle
									</span>
									Add server
								</Fab>
							</div>
						</motion.div>
					)}

					{/* About */}
					{tabValue === 10 && (
						<div className="settings-container settings-about">
							<img src={logo} className="settings-logo" alt="JellyPlayer" />
							<div className="settings-grid">
								<div className="settings-info-container">
									<div className="settings-info">
										<Typography>Client Version:</Typography>
										<Chip
											icon={
												<span className="material-symbols-rounded">
													{updateInfo.data?.shouldUpdate
														? "update"
														: "update_disabled"}
												</span>
											}
											label={
												<Typography variant="subtitle1">
													{applicationVersion}
												</Typography>
											}
											color={
												updateInfo.data?.shouldUpdate ? "error" : "success"
											}
											size="medium"
											style={{
												width: "fit-content !important",
											}}
										/>
									</div>
									<div className="settings-info">
										<Typography>Update Available:</Typography>
										<Typography>
											{updateInfo.isFetching
												? "Checking for new updates..."
												: updateInfo.data?.shouldUpdate
												  ? updateInfo.data.manifest?.version
												  : "No update found."}
										</Typography>
									</div>
									<LoadingButton
										style={{
											marginTop: "auto",
										}}
										loading={updateInfo.isFetching || updating}
										variant="contained"
										disabled={!updateInfo.data?.shouldUpdate}
										loadingPosition="start"
										onClick={async () => {
											if (updateInfo.data?.shouldUpdate) {
												setUpdating(true);
												await installUpdate();
												enqueueSnackbar(
													"Update has been installed! You need to relaunch JellyPlayer.",
													{
														variant: "success",
													},
												);
												await relaunch();
											}
										}}
									>
										{updateInfo.isFetching
											? "Checking for Update..."
											: updateInfo.data?.shouldUpdate
											  ? "Update"
											  : "No Update Found"}
									</LoadingButton>
								</div>
								{systemInfo.isSuccess ? (
									<div className="settings-info-container">
										<div className="settings-info">
											<Typography>Server:</Typography>
											<Typography>{systemInfo.data?.ServerName}</Typography>
										</div>
										<div className="settings-info">
											<Typography>Jellyfin Version:</Typography>
											<Typography>{systemInfo.data?.Version}</Typography>
										</div>
										<div className="settings-info">
											<Typography>Operating System:</Typography>
											<Typography>
												{systemInfo.data?.OperatingSystemDisplayName}
											</Typography>
										</div>
										<div className="settings-info">
											<Typography>Server Architecture:</Typography>
											<Typography>
												{systemInfo.data?.SystemArchitecture}
											</Typography>
										</div>
									</div>
								) : (
									<Skeleton
										variant="rectangular"
										sx={{
											height: "100%",
											borderRadius: "10px",
										}}
									/>
								)}
							</div>
							<div
								style={{
									marginTop: "1em",
									background: "rgb(0 0 0 / 0.3)",
									padding: "1em",
									borderRadius: "10px",
									border: "1px solid rgb(255 255 255 / 0.1)",
								}}
							>
								<Typography variant="h6" fontWeight={300} mb={1}>
									Links:
								</Typography>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										gap: "0.1em",
									}}
								>
									<Link
										target="_blank"
										href="https://github.com/prayag17/JellyPlayer"
									>
										https://github.com/prayag17/JellyPlayer
									</Link>
									<Link target="_blank" href="https://jellyfin.org">
										https://jellyfin.org
									</Link>
								</div>
							</div>
						</div>
					)}
				</motion.div>
			</AnimatePresence>
			{/* Show dialog before deleting or changing server */}
			<Dialog open={ask} fullWidth maxWidth="xs">
				<DialogTitle>Are you sure?</DialogTitle>
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
						color="error"
						fullWidth
						onClick={() => setAsk(false)}
					>
						No
					</Button>
					<Button
						variant="contained"
						color="success"
						fullWidth
						style={{
							margin: 0,
						}}
						onClick={() => {
							if (action === "change-server") {
								handleServerChange.mutate();
							} else if (action === "delete-server") {
								handleDelete(serverState);
							}
						}}
					>
						yes
					</Button>
				</DialogActions>
			</Dialog>

			{/* Add Server */}
			<Dialog open={addServerDialog} fullWidth>
				<DialogTitle>Add Server</DialogTitle>
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
						Close
					</Button>
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
						Add
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</Dialog>
	);
};

export default Settings;
