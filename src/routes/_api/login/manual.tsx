import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import React, { type FormEvent, useLayoutEffect, useState } from "react";

import { saveUser } from "@/utils/storage/user.js";

import LoadingButton from "@mui/lab/LoadingButton";
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	FilledInput,
	Grid,
	OutlinedInput,
	Paper,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";

import { useSnackbar } from "notistack";

import { AppBarBackOnly } from "@/components/appBar/backOnly.jsx";
import { useApiInContext } from "@/utils/store/api.js";
import { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";
import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api/quick-connect-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import "./login.scss";

import { setBackdrop } from "@/utils/store/backdrop.js";
import { blue } from "@mui/material/colors";
import {
	createFileRoute,
	useNavigate,
	useRouteContext,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_api/login/manual")({
	component: UserLoginManual,
});

function UserLoginManual() {
	const [loading, setLoading] = useState(false);
	const [quickConnectLoading, setQuickConnectLoading] = useState(-1);
	const [quickConnectCode, setQuickConnectCode] = useState("");
	const [rememberMe, setRememberMe] = useState(true);
	// console.log(Route.useRouteContext());
	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);
	const router = useRouter();
	const searchParams = Route.useSearch();

	const server = useQuery({
		queryKey: ["login", "manual", "serverInfo"],
		queryFn: async () => {
			return (await getBrandingApi(api).getBrandingOptions()).data;
		},
	});

	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState<{
		password: string | undefined;
		showpass: boolean;
	}>({
		showpass: false,
		password: "",
	});

	const handlePassword = (prop) => (event) => {
		setPassword({
			...password,
			[prop]: event.target.value,
		});
	};

	const handleShowPassword = () => {
		setPassword({
			...password,
			showpass: !password.showpass,
		});
	};

	const handleLoginFn = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			const authenticate = await api.authenticateUserByName(
				username,
				password.password,
			);
			createApi(api.basePath, authenticate.data?.AccessToken);

			if (rememberMe) await saveUser(username, authenticate.data.AccessToken);

			router.invalidate().finally(() => {
				navigate({ to: searchParams.redirect || "/home", replace: true });
			});
		} catch (err) {
			console.error(err);
			enqueueSnackbar(
				"Unable to authenticate. Please check your username and password",
				{ variant: "error" },
			);
		}
		return;
	};

	const handleLogin = useMutation({
		mutationKey: ["login", "authenticate"],
		mutationFn: handleLoginFn,
	});

	const handleCheckRememberMe = (event) => {
		setRememberMe(event.target.checked);
	};

	const handleQuickConnect = async () => {
		setQuickConnectLoading(0);

		const quickApi = getQuickConnectApi(api);

		const headers = {
			"X-Emby-Authorization": `MediaBrowser Client="${api.clientInfo.name}", Device="${api.deviceInfo.name}", DeviceId="${api.deviceInfo.id}", Version="${api.clientInfo.version}"`,
		};

		const quickConnectInitiation = await quickApi
			.initiate({
				headers,
			})
			.catch(() => ({ status: 401 }));

		if (quickConnectInitiation.status !== 200) {
			setQuickConnectCode("");
			setQuickConnectLoading(-1);
			enqueueSnackbar("Unable to use Quick Connect", {
				variant: "error",
			});
			return;
		}

		setQuickConnectLoading(1);

		const { Secret, Code } = quickConnectInitiation.data;

		setQuickConnectCode(Code);

		const interval = setInterval(async () => {
			const quickConnectCheck = await quickApi
				.connect({
					secret: Secret,
				})
				.catch(() => ({ status: 401, data: { Authenticated: false } }));

			if (quickConnectCheck.status !== 200) {
				enqueueSnackbar("Unable to use Quick Connect", {
					variant: "error",
				});

				setQuickConnectLoading(-1);
				clearInterval(interval);
				return;
			}

			if (!quickConnectCheck.data.Authenticated) {
				return;
			}

			const auth = await getUserApi(api)
				.authenticateWithQuickConnect({
					quickConnectDto: {
						Secret: Secret,
					},
				})
				.catch(() => ({ status: 401 }));

			api.accessToken = auth.data.AccessToken;

			clearInterval(interval);

			if (auth.status !== 200) {
				enqueueSnackbar("Unable to use Quick Connect", {
					variant: "error",
				});
				setQuickConnectLoading(-1);
				return;
			}

			sessionStorage.setItem("accessToken", auth.data.AccessToken);
			createApi(api.basePath, auth.data.AccessToken);

			if (rememberMe === true) {
				await saveUser(userName, auth.data.AccessToken);
			}

			setQuickConnectLoading(-1);
			enqueueSnackbar(`Logged in as ${auth.data.User.Name}!`, {
				variant: "success",
			});
			navigate("/home");
		}, 1000);

		setLoading(false);
	};

	useLayoutEffect(() => {
		setBackdrop("", "");
	}, []);

	return (
		<>
			<AppBarBackOnly />
			<div className="login scrollY">
				<div
					className={`login-form-container ${
						server.data?.LoginDisclaimer && "padded-top"
					}`}
				>
					<Typography variant="h3" color="textPrimary">
						Login
					</Typography>
					<form className="login-form" onSubmit={(e) => handleLogin.mutate(e)}>
						<TextField
							variant="outlined"
							label="Username"
							onChange={(e) => setUsername(e.currentTarget.value)}
						/>
						<FormControl sx={{ width: "100%" }} variant="outlined">
							<InputLabel htmlFor="user-password">Password:</InputLabel>
							<OutlinedInput
								fullWidth
								id="user-password"
								type={password.showpass ? "text" : "password"}
								onChange={handlePassword("password")}
								label="Password:"
								endAdornment={
									<InputAdornment position="end">
										<IconButton
											onClick={handleShowPassword}
											aria-label="toggle password visibility"
										>
											{password.showpass ? (
												<span className="material-symbols-rounded">
													visibility
												</span>
											) : (
												<span className="material-symbols-rounded">
													visibility_off
												</span>
											)}
										</IconButton>
									</InputAdornment>
								}
							/>
						</FormControl>
						<FormControlLabel
							control={
								<Checkbox
									checked={rememberMe}
									onChange={handleCheckRememberMe}
								/>
							}
							label="Remember me"
						/>
						<div
							className="flex flex-row"
							style={{ width: "100%", gap: "0.8em", flexWrap: "wrap" }}
						>
							<LoadingButton
								variant="contained"
								type="submit"
								loading={handleLogin.isPending}
								sx={{ width: "100%" }}
							>
								Login
							</LoadingButton>
							<LoadingButton
								onClick={handleQuickConnect}
								variant="contained"
								className="userEventButton"
								style={{ flex: 1 }}
								loading={quickConnectLoading === 1}
								// size="large"
							>
								Quick Connect
							</LoadingButton>
							<Button
								color="secondary"
								variant="contained"
								className="userEventButton"
								// size="large"
								style={{ flex: 1 }}
								onClick={() => navigate("/servers/list")}
							>
								Change Server
							</Button>
						</div>
					</form>
				</div>
				{server.isSuccess && server.data.LoginDisclaimer && (
					<Paper
						elevation={5}
						style={{
							marginTop: "1em",
							padding: "1em",
							borderRadius: "15px",
							width: "32em",
						}}
					>
						<div
							className="flex flex-row flex-align-center"
							style={{ gap: "0.5em", marginBottom: "0.5em" }}
						>
							<span
								className="material-symbols-rounded"
								style={{
									color: blue[700],
									"--fill": 1,
								}}
							>
								info
							</span>
							Notice
						</div>
						<Typography variant="subtitle2" style={{ opacity: 0.8 }}>
							{server.data.LoginDisclaimer}
						</Typography>
					</Paper>
				)}
				<Dialog open={Boolean(quickConnectCode)} fullWidth maxWidth="xs">
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
									onClick={(e) => {
										navigator.clipboard.writeText(quickConnectCode);
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
									checked={rememberMe}
									onChange={handleCheckRememberMe}
								/>
							}
							label="Remember device"
						/>
						<Button
							variant="contained"
							onClick={() => {
								setQuickConnectCode("");
								setQuickConnectLoading(-1);
							}}
						>
							Close
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		</>
	);
}
