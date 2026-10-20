import { getAuthenticationApi } from "@jellyfin/sdk/lib/utils/api/authentication-api";
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
import { useNavigate, useRouter } from "@tanstack/react-router";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useSnackbar } from "notistack";
import React, { useCallback, useState } from "react";
import useInterval from "@/utils/hooks/useInterval";
import { saveUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";

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
	const router = useRouter();

	const quickConnectEnabled = useQuery({
		queryKey: ["quick-connect-button", "check-quick-connect-enabled"],
		queryFn: api
			? async () => await getAuthenticationApi(api).getQuickConnectEnabled()
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
				return await getAuthenticationApi(api).authenticateWithQuickConnect(
					{ quickConnectDto: { Secret: quickConnectSecret } },
					{ headers },
				);
			}
		},
		onSuccess: async (result) => {
			const { AccessToken, User } = result?.data ?? {};
			if (api && AccessToken && User?.Name && User.Id) {
				setCheckForQuickConnect(false);
				enqueueSnackbar(`Logged in as ${User.Name}!`, {
					variant: "success",
				});
				createApi(api.basePath, AccessToken);
				if (rememberUser) {
					await saveUser(User.Name, AccessToken, User.Id);
				}
				router.invalidate().finally(() => {
					navigate({ to: "/home", replace: true });
				});
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
				await getAuthenticationApi(api).getQuickConnectState(
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
				return await getAuthenticationApi(api).initiateQuickConnect({
					headers,
				});
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
				onClick={() => initQuickConnect.mutate()}
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
				slots={{
					transition: Transition,
				}}
				slotProps={{
					paper: { className: "glass", sx: { borderRadius: "24px" } },
				}}
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
						style={{
							width: "100%",
						}}
						sx={{
							mb: 2,
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
								onClick={async () => {
									quickConnectCode && (await writeText(quickConnectCode));
									enqueueSnackbar("Quick Connect Code copied!", {
										variant: "info",
										key: "copiedText",
									});
								}}
								sx={{
									textAlign: "center",
									background: "rgb(255 255 255 / 0.1)",
									width: "fit-content",
									padding: "0.4em",
									borderRadius: "10px",
									cursor: "pointer",
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
