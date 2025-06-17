import useSettingsStore, {
	setSettingsDialogOpen,
	setSettingsTabValue,
} from "@/utils/store/settings";
import {
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Fab, FormControlLabel,
	IconButton,
	Link, MenuItem,
	Skeleton,
	Tab,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import React, { useState, useMemo, useCallback } from "react";

import logo from "@/assets/logo.png";

import { jellyfin, useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { getDisplayPreferencesApi } from "@jellyfin/sdk/lib/utils/api/display-preferences-api";
import { getLocalizationApi } from "@jellyfin/sdk/lib/utils/api/localization-api";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import "./settings.scss";

import {
	delServer,
	getAllServers,
	getDefaultServer,
	setDefaultServer,
	setServer,
} from "@/utils/storage/servers";
import { allSettings } from "@/utils/storage/settings";
import { delUser } from "@/utils/storage/user";
import type { RecommendedServerInfo } from "@jellyfin/sdk";
import { LoadingButton } from "@mui/lab";
import { red } from "@mui/material/colors";
import { useNavigate } from "@tanstack/react-router";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useSnackbar } from "notistack";
import SettingOption from "../settingOption";
import SettingOptionSelect from "../settingOptionSelect";

import i18next from "i18next";
import { useTranslation } from "react-i18next";

const motionConfig = {
	initial: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
	},
};

type languageOption = { language: string; code: string };

const languageOptions: languageOption[] = [
	{ language: "English", code: "en" },
	{ language: "Français", code: "fr" },
];

const Settings = () => {
	const [open, tabValue] = useSettingsStore((state) => [
		state.dialogOpen,
		state.tabValue,
	]);

	// Set the initial language from i18next's detected or default language
	const [language, setLanguage] = useState(i18next.language);

	const { t } = useTranslation();

	const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedLanguage = e.target.value;
		setLanguage(selectedLanguage);
		i18next.changeLanguage(selectedLanguage); // Update language in i18next
	};

	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);

	const user = useCentralStore((state) => state.currentUser);

	const systemInfo = useQuery({
		queryKey: ["about", "systemInfo"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getSystemApi(api).getSystemInfo();
			return result.data;
		},
		enabled: Boolean(api) && open,
	});

	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();

	const [applicationVersion] = useCentralStore((state) => [state.clientVersion]);

	const serversOnDisk = useQuery({
		queryKey: ["settings", "serversOnDisk"],
		queryFn: async () => await getAllServers(),
		enabled: open,
	});

	const updateInfo = useQuery({
		queryKey: ["about", "updater"],
		queryFn: async () => await check(),
		enabled: open,
	});

	const defaultServer = useQuery({
		queryKey: ["settings", "default-server"],
		queryFn: async () => await getDefaultServer(),
		enabled: open,
	});

	const cultures = useQuery({
		queryKey: ["settings", "cultures"],
		queryFn: async () => {
			if (!api) return;
			const result = await getLocalizationApi(api).getCultures();
			return result.data;
		},
		enabled: open,
	});

	const clientSettingsOnServer = useQuery({
		queryKey: ["settings", "clientSettings"],
		queryFn: async () => {
			if (!api) return;
			const result = await getDisplayPreferencesApi(api).getDisplayPreferences({
				client: "blink",
				userId: user?.Id,
				displayPreferencesId: api.deviceInfo.id,
			});
			return result.data;
		},
		enabled: open,
	});


	const queryClient = useQueryClient();

	// Server Management
	const [updating, setUpdating] = useState(false);
	const [addServerDialog, setAddServerDialog] = useState(false);
	const [serverIp, setServerIp] = useState("");

	const handleServerChange = useMutation({
		mutationFn: async (server: RecommendedServerInfo) => {
			await delUser();
			await setDefaultServer(server.systemInfo?.Id ?? "");
			await defaultServer.refetch();
			createApi(server.address, undefined);
			queryClient.removeQueries();
		},
		onSuccess: async () => {
			setSettingsDialogOpen(false);
			navigate({ to: "/login" });
		},
		onError: (error) => {
			console.error(error);
			enqueueSnackbar(t("settings.servers.errors.changing_server"), {
				variant: "error",
			});
		},
	});

	const handleDelete = useMutation({
		mutationKey: ["server-delete"],
		mutationFn: async (server: RecommendedServerInfo) => {
			await delServer(server.systemInfo?.Id ?? "");

			if (server.systemInfo?.Id === defaultServer.data) {
				await delUser();
				await serversOnDisk.refetch();

				if (serversOnDisk.data?.length) {
					setDefaultServer(serversOnDisk.data[0].id);
					createApi(serversOnDisk.data[0].address, undefined);
				} else {
					// TODO: Reset api in context
					// useApi.setState(useApi.getInitialState());
				}
				setSettingsDialogOpen(false);
				await queryClient.removeQueries();
				navigate({ to: "/" });
			}
			enqueueSnackbar(t("settings.servers.success.deleting_server"), { variant: "success" });
			await serversOnDisk.refetch();
			await defaultServer.refetch();
		},
	});

	const addServer = useMutation({
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
				await serversOnDisk.refetch();
			}
		},
		onError: (err) => {
			console.error(err);
			enqueueSnackbar(`${err}`, { variant: "error" });
			enqueueSnackbar(t("settings.servers.errors.unknow"), { variant: "error" });
		},
		onSettled: async (bestServer) => {
			if (!bestServer) {
				enqueueSnackbar(t("settings.servers.errors.invalid_jellyfin_server"), {
					variant: "error",
				});
			}
		},
	});

	// Memoize PaperProps to prevent unnecessary re-renders
	const paperProps = useMemo(
		() => ({
			className: "settings glass",
			elevation: 10,
		}),
		[],
	);

	// Memoize onClose function to prevent unnecessary re-renders
	const handleClose = useCallback(() => {
		setSettingsDialogOpen(false);
	}, []);

	return (
		<Dialog
			open={open}
			fullWidth
			maxWidth="md"
			slotProps={{ paper: paperProps }}
			hideBackdrop
			onClose={handleClose}
		>
			<Tabs
				orientation="vertical"
				value={tabValue}
				onChange={(_, newValue) => {
					setSettingsTabValue(newValue);
				}}
				style={{
					background: "rgb(0 0 0 / 0.4)",
				}}
			>
				<Tab
					icon={<span className="material-symbols-rounded">settings</span>}
					iconPosition="start"
					value={1}
					label={t("settings.general.navtitle")}
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
					label={t("settings.servers.navtitle")}
					className="settings-tab"
					sx={{
						minHeight: "48px",
						height: "48px",
					}}
				/>
				<Tab
					icon={<span className="material-symbols-rounded">tune</span>}
					iconPosition="start"
					value={3}
					label={t("settings.preferences.navtitle")}
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
					label={t("settings.about.navtitle")}
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
							{allSettings.general.map((setting) => (
								<SettingOption key={setting.key} setting={setting} />
							))}
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
											exit={{ transform: "translateY(-10px)", opacity: 0 }}
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
														handleServerChange.mutate(server);
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
														handleDelete.mutate(server);
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
									{t("settings.servers.add_server")}
								</Fab>
							</div>
						</motion.div>
					)}

					{/* Preferences */}
					{tabValue === 3 && cultures.isSuccess && (
						<div className="settings-container">
							<SettingOptionSelect
								setting={{
									name: t("settings.preferences.audiolang.name"),
									description: t("settings.preferences.audiolang.name"),
								}}
								userValue={
									user?.Configuration?.AudioLanguagePreference ?? "anyLanguage"
								}
								options={cultures.data ?? []}
							/>
							<FormControlLabel
								value={language}
								control={
									<TextField select onChange={handleLanguageChange}>
										{languageOptions.map(({ language, code }, key) => (
											<MenuItem
												key={code}
												value={code ?? "none"}
											>
											{language}
											</MenuItem>
										))}
									</TextField>
								}
								label={
									<div className="settings-option-info">
										<Typography variant="subtitle1" fontWeight={400}>
											{t("settings.preferences.interfacelang.name")}
										</Typography>
										<Typography
											variant="caption"
											className="settings-option-info-caption"
										>
											{t("settings.preferences.interfacelang.description")}
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>

						</div>
					)}

					{/* About */}
					{tabValue === 10 && (
						<div className="settings-container settings-about">
							<img src={logo} className="settings-logo" alt="Blink" />
							<div className="settings-grid">
								<div className="settings-info-container">
									<div className="settings-info">
										<Typography variant="subtitle2">{t("settings.about.version.client_version")}</Typography>
										<Chip
											icon={
												<span
													className="material-symbols-rounded"
													// style={{ "--wght": 500 }}
												>
													{updateInfo.data?.available
														? "release_alert"
														: "new_releases"}
												</span>
											}
											label={
												<Typography variant="subtitle2">
													{applicationVersion}
												</Typography>
											}
											color={updateInfo.data?.available ? "error" : "success"}
											size="small"
											style={{
												width: "fit-content !important",
											}}
										/>
									</div>
									<div className="settings-info">
										<Typography variant="subtitle2">
											{t("settings.about.version.update_available")}
										</Typography>
										<Typography variant="subtitle2">
											{updateInfo.isFetching ? (
												t("settings.about.version.checking_update")
											) : updateInfo.data?.available ? (
												<Chip
													icon={
														<span className="material-symbols-rounded">
															new_releases
														</span>
													}
													label={
														<Typography variant="subtitle2">
															{applicationVersion}
														</Typography>
													}
													color="success"
													size="small"
													style={{
														width: "fit-content !important",
													}}
												/>
											) : (
												t("settings.about.version.no_update")
											)}
										</Typography>
									</div>
									<LoadingButton
										style={{
											marginTop: "auto",
										}}
										loading={updateInfo.isFetching || updating}
										variant="contained"
										disabled={!updateInfo.data?.available}
										loadingPosition="start"
										onClick={async () => {
											if (updateInfo.data?.available) {
												setUpdating(true);
												await updateInfo.data?.downloadAndInstall();
												enqueueSnackbar(
													t("settings.about.version.button.update_installed"),
													{
														variant: "success",
													},
												);
												await relaunch();
											}
										}}
									>
										{updateInfo.isFetching
											? t("settings.about.version.button.checking_update")
											: updateInfo.data?.available
												? t("settings.about.version.button.update")
												: t("settings.about.version.button.no_update")}
									</LoadingButton>
								</div>
								{systemInfo.isSuccess ? (
									<div className="settings-info-container">
										<div className="settings-info">
											<Typography variant="subtitle2">{t("settings.about.server_information.server")}</Typography>
											<Typography variant="subtitle2">
												{systemInfo.data?.ServerName}
											</Typography>
										</div>
										<div className="settings-info">
											<Typography variant="subtitle2">
												{t("settings.about.server_information.version")}
											</Typography>
											<Typography variant="subtitle2">
												{systemInfo.data?.Version}
											</Typography>
										</div>
										<div className="settings-info">
											<Typography variant="subtitle2">
												{t("settings.about.server_information.architecture")}
											</Typography>
											<Typography variant="subtitle2">
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
								}}
							>
								<Typography variant="subtitle1" mb={1}>
									{t("settings.about.links")}
								</Typography>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										gap: "0.1em",
									}}
								>
									<Typography
										component={Link}
										variant="subtitle2"
										target="_blank"
										href="https://github.com/prayag17/Blink"
									>
										https://github.com/prayag17/Blink
									</Typography>
									<Typography
										component={Link}
										variant="subtitle2"
										target="_blank"
										href="https://jellyfin.org"
									>
										https://jellyfin.org
									</Typography>
								</div>
							</div>
						</div>
					)}
				</motion.div>
			</AnimatePresence>

			{/* Add Server */}
			<Dialog
				open={addServerDialog}
				fullWidth
				hideBackdrop
				disableScrollLock={true}
			>
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
						Add
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</Dialog>
	);
};

export default Settings;
