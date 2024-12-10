import useInterval from "@/utils/hooks/useInterval";
import { saveUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";
import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api/quick-connect-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { LoadingButton, type LoadingButtonProps } from "@mui/lab";
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	FormControlLabel,
	Slide,
	Tooltip,
	Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useSnackbar } from "notistack";
import React, { useCallback, useState } from "react";

const Transition = React.forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return (
		<Slide
			direction="up"
			mountOnEnter
			unmountOnExit
			ref={ref}
			timeout={{ enter: 500, exit: 1500 }}
			{...props}
		/>
	);
});

const QuickConnectButton = (props: LoadingButtonProps) => {
	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);
	// if (!api) {
	// 	console.error(
	// 		"Unable to display quick connect button, api is not available",
	// 	);
	// 	return null;
	// }

	const headers = {
		"X-Emby-Authorization": `MediaBrowser Client="${api?.clientInfo.name}", Device="${api?.deviceInfo.name}", DeviceId="${api?.deviceInfo.id}", Version="${api?.clientInfo.version}"`,
	};

	const navigate = useNavigate();

	const quickConnectEnabled = useQuery({
		queryKey: ["quick-connect-button", "check-quick-connect-enabled"],
		queryFn: api
			? async () => await getQuickConnectApi(api).getQuickConnectEnabled()
			: skipToken,
		enabled: Boolean(api),
	});

	const { enqueueSnackbar } = useSnackbar();
	const [quickConnectCode, setQuickConnectCode] = useState<string | null>();
	const [quickConnectSecret, setQuickConnectSecret] = useState<string | null>();
	const [checkForQuickConnect, setCheckForQuickConnect] = useState(false);
	const [rememberUser, setRememberUser] = useState(true);
	const authenticateUser = useMutation({
		mutationKey: ["quick-connect-button", "authenticate-user"],
		mutationFn: async () => {
			if (api && quickConnectSecret) {
				return await getUserApi(api).authenticateWithQuickConnect(
					{ quickConnectDto: { Secret: quickConnectSecret } },
					{ headers },
				);
			}
		},
		onSuccess: (result) => {
			if (api && result?.data?.AccessToken && result.data.User?.Name) {
				setCheckForQuickConnect(false);
				// saveUser({ username, password, rememberMe: rememberUser });
				enqueueSnackbar(`Logged in as ${result.data.User?.Name}!`, {
					variant: "success",
				});
				createApi(api.basePath, result.data.AccessToken);
				if (rememberUser) {
					saveUser(result.data.User?.Name, result.data.AccessToken);
				}
				navigate({ to: "/home", replace: true });
			}
		},
		onError: (error) => {
			enqueueSnackbar("Error authenticating user.", { variant: "error" });
			console.error(error);
		},
	});
	const checkQuickConnectStatus = useMutation({
		mutationKey: ["quick-connect-button", "check-quick-connect-status"],
		mutationFn: async (secret: string) =>
			api &&
			(
				await getQuickConnectApi(api).getQuickConnectState(
					{ secret },
					{ headers },
				)
			).data,
		onSuccess: (result) => {
			if (result?.Authenticated) {
				setQuickConnectCode(null);
				initQuickConnect.reset();
				checkQuickConnectStatus.reset();
				authenticateUser.mutate();
			}
		},
	});
	const initQuickConnect = useMutation({
		mutationKey: ["quick-connect-button", "initiate-connection"],
		mutationFn: async () => {
			if (!quickConnectEnabled.data?.data) {
				enqueueSnackbar("Quick Connect is not enabled on server.", {
					variant: "error",
				});
			}
			if (api) {
				return await getQuickConnectApi(api).initiateQuickConnect({ headers });
			}
		},
		onSuccess: (result) => {
			setQuickConnectCode(result?.data.Code);
			setQuickConnectSecret(result?.data.Secret);
			setCheckForQuickConnect(true);
		},
		onError: (error) => {
			enqueueSnackbar("Error initiating Quick Connect.", { variant: "error" });
			console.error(error);
		},
	});

	const handleQuickConnectClose = useCallback(() => {
		setQuickConnectCode(null);
		setCheckForQuickConnect(false);
		initQuickConnect.reset();
		checkQuickConnectStatus.reset();
	}, []);

	useInterval(
		() => {
			if (quickConnectSecret) {
				console.log(checkForQuickConnect);
				checkQuickConnectStatus.mutate(quickConnectSecret);
			}
		},
		checkForQuickConnect ? 1500 : null,
	);

	return (
		<div style={{ marginLeft: "auto" }}>
			{/* @ts-ignore */}
			<LoadingButton
				{...props}
				disabled={
					quickConnectEnabled.isPending ||
					Boolean(!quickConnectEnabled.data?.data)
				}
				loading={Boolean(
					initQuickConnect.isPending ||
						checkQuickConnectStatus.isPending ||
						(quickConnectCode && !checkQuickConnectStatus.data?.Authenticated),
				)}
				variant={props.variant ?? "contained"}
				onClick={initQuickConnect.mutate}
			>
				{quickConnectEnabled.data?.data
					? "Use Quick Connect"
					: "Quick Connect Disabled"}
			</LoadingButton>
			<Dialog
				open={Boolean(quickConnectCode)}
				onClose={handleQuickConnectClose}
				fullWidth
				maxWidth="xs"
				TransitionComponent={Transition}
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
								onClick={async () => {
									quickConnectCode && (await writeText(quickConnectCode));
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
					<Button variant="contained" onClick={handleQuickConnectClose}>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default QuickConnectButton;