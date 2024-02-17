import {
	Chip,
	Dialog,
	FormControlLabel,
	Link,
	Skeleton,
	Switch,
	Tab,
	Tabs,
	Typography,
	styled,
	withStyles,
} from "@mui/material";
import { AnimatePresence, motion, transform } from "framer-motion";
import React, { useState } from "react";
import useSettingsStore, {
	setSettingsDialogOpen,
	setSettingsTabValue,
} from "../../utils/store/settings";

import logo from "../../assets/logoBlack.png";

import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../utils/store/api";
import { useCentralStore } from "../../utils/store/central";
import "./settings.module.scss";

import { LoadingButton } from "@mui/lab";
import { relaunch } from "@tauri-apps/api/process";
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { enqueueSnackbar, useSnackbar } from "notistack";

const motionConfig = {
	forward: {
		opacity: 0,
		transform: "translateY(-20px)",
	},
	visible: {
		opacity: 1,
		transform: "translateY(0px)",
	},
	backward: {
		opacity: 0,
		transform: "translateY(20px)",
	},
};

const Settings = () => {
	const [api] = useApi((state) => [state.api]);
	const systemInfo = useQuery({
		queryKey: ["about", "systemInfo"],
		queryFn: async () => {
			const result = await getSystemApi(api).getSystemInfo();
			return result.data;
		},
		enabled: Boolean(api),
	});

	const updateInfo = useQuery({
		queryKey: ["about", "updater"],
		queryFn: async () => {
			const result = await checkUpdate();
			return result;
		},
	});

	const { enqueueSnackbar } = useSnackbar();

	const [open, tabValue] = useSettingsStore((state) => [
		state.dialogOpen,
		state.tabValue,
	]);

	const [applicationVersion] = useCentralStore((state) => [
		state.clientVersion,
	]);

	const [updating, setUpdating] = useState(false);
	const [animDirection, setAnimDirection] = useState("forward");

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
					if (newValue > tabValue) {
						setAnimDirection("backward");
					} else {
						setAnimDirection("forward");
					}
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
					icon={<span className="material-symbols-rounded">info</span>}
					iconPosition="start"
					value={10}
					label="About"
					className="settings-tab"
					sx={{
						minHeight: "48px",
						height: "48px",
					}}
				/>
			</Tabs>
			<AnimatePresence mode="wait">
				<motion.div
					variants={motionConfig}
					initial={animDirection === "backward" ? "backward" : "forward"}
					animate="visible"
					exit={animDirection === "backward" ? "backward" : "forward"}
					key={tabValue}
					transition={{
						duration: 0.1,
					}}
					className="settings-scroll "
				>
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
									<Link href="https://github.com/prayag17/JellyPlayer">
										https://github.com/prayag17/JellyPlayer
									</Link>
									<Link href="https://jellyfin.org">https://jellyfin.org</Link>
								</div>
							</div>
						</div>
					)}

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
				</motion.div>
			</AnimatePresence>
		</Dialog>
	);
};

export default Settings;
