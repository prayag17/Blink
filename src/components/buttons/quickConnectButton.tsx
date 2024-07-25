import { saveUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";
import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api/quick-connect-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { LoadingButton } from "@mui/lab";
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	FormControlLabel,
	Tooltip,
	Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Timeout } from "@tanstack/react-router/dist/esm/utils";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useSnackbar } from "notistack";
import React, { useState } from "react";

const QuickConnectButton = () => {
	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);
	const headers = {
		"X-Emby-Authorization": `MediaBrowser Client="${api.clientInfo.name}", Device="${api.deviceInfo.name}", DeviceId="${api.deviceInfo.id}", Version="${api.clientInfo.version}"`,
	};

	const [quickConnectStatusInterval, setQuickConnectStatusInterval] =
		useState<Timeout | null>(null);

	const quickConnectEnabled = useQuery({
		queryKey: ["quick-connect-button", "check-quick-connect-enabled"],
		queryFn: async () => await getQuickConnectApi(api).getQuickConnectEnabled(),
	});

	const navigate = useNavigate();

	const { enqueueSnackbar } = useSnackbar();
	const [quickConnectCode, setQuickConnectCode] = useState<string | null>();
	const [rememberUser, setRememberUser] = useState(true);
	const checkQuickConnectStatus = useMutation({
		mutationKey: ["quick-connect-button", "check-quick-connect-status"],
		mutationFn: async (secret: string) =>
			(
				await getQuickConnectApi(api).getQuickConnectState(
					{ secret },
					{ headers },
				)
			).data,
	});
	const initQuickConnect = useMutation({
		mutationKey: ["quick-connect-button", "initiate-connection"],
		mutationFn: async () => {
			if (!quickConnectEnabled.data?.data) {
				enqueueSnackbar("Quick Connect is not enabled on server.", {
					variant: "error",
				});
			}
			return await getQuickConnectApi(api).initiateQuickConnect({ headers });
		},
		onSuccess: (result) => {
			setQuickConnectCode(result.data.Code);
			const authAwaitInterval = setInterval(async () => {
				// Check if user has been authenticated by the server
				const quickConnectCheck = await checkQuickConnectStatus.mutateAsync(
					result.data.Secret,
				);
				if (quickConnectCheck.Authenticated) {
					const userAuth = await getUserApi(api).authenticateWithQuickConnect({
						quickConnectDto: {
							Secret: quickConnectCheck.Secret,
						},
					});
					enqueueSnackbar(`Logged in as ${userAuth.data.User?.Name}!`, {
						variant: "success",
					});
					sessionStorage.setItem("accessToken", userAuth.data.AccessToken);
					createApi(api.basePath, userAuth.data.AccessToken);

					if (rememberUser) {
						await saveUser(userAuth.data.User?.Name, userAuth.data.AccessToken);
					}

					clearInterval(authAwaitInterval);

					navigate({ to: "/home" });
				}
			}, 1000);
			setQuickConnectStatusInterval(authAwaitInterval);
		},
		onError: (error) => {
			enqueueSnackbar("Error initiating Quick Connect.", { variant: "error" });
			console.error(error);
		},
	});
	return (
		<>
			<LoadingButton
				disabled={
					quickConnectEnabled.isPending ||
					Boolean(!quickConnectEnabled.data?.data)
				}
				loading={
					initQuickConnect.isPending ||
					checkQuickConnectStatus.isPending ||
					(quickConnectCode && !checkQuickConnectStatus.data?.Authenticated)
				}
				variant="contained"
				size="large"
				style={{ flex: 1 }}
				onClick={initQuickConnect.mutate}
			>
				Quick Connect
			</LoadingButton>
			<Dialog
				open={Boolean(quickConnectCode)}
				onClose={() => {
					setQuickConnectCode(null);
					clearInterval(quickConnectStatusInterval);
				}}
				fullWidth
				maxWidth="xs"
			>
				<DialogContent
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<Typography
						variant="h5"
						mb={2}
						style={{
							width: "100%",
						}}
					>
						Quick Connect Code:
					</Typography>
					<DialogContentText>
						Use this code in the Quick Connect tab in your server to login.
					</DialogContentText>
					<div
						className="flex flex-row"
						style={{ gap: "1em", alignItems: "center", marginTop: "1em" }}
					>
						<Tooltip title="Click to copy" arrow placement="top">
							<Typography
								variant="h3"
								color="textPrimary"
								textAlign="center"
								sx={{
									background: "rgb(255 255 255 / 0.1)",
									width: "fit-content",
									padding: "0.4em",
									borderRadius: "10px",
									cursor: "pointer",
								}}
								onClick={async (e) => {
									await writeText(quickConnectCode);
									enqueueSnackbar("Quick Connect Code copied!", {
										variant: "info",
										key: "copiedText",
									});
								}}
							>
								{quickConnectCode}
							</Typography>
						</Tooltip>
					</div>
				</DialogContent>
				<DialogActions
					className="flex flex-row"
					sx={{
						padding: "0em 1em 1em 1em",
						justifyContent: "space-between",
					}}
				>
					<FormControlLabel
						control={
							<Checkbox
								checked={rememberUser}
								onChange={(e) => setRememberUser(e.target.checked)}
							/>
						}
						label="Remember device"
					/>
					<Button
						variant="contained"
						onClick={() => {
							setQuickConnectCode(null);
						}}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default QuickConnectButton;