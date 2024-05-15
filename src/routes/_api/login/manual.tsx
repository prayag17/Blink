import { queryOptions, useQuery } from "@tanstack/react-query";
import React, { useLayoutEffect, useState } from "react";

import { saveUser } from "@/utils/storage/user.js";

import LoadingButton from "@mui/lab/LoadingButton";
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	Grid,
	OutlinedInput,
	Paper,
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
import { createApi, useApiInContext } from "@/utils/store/api.js";
import { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";
import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api/quick-connect-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import "./login.scss";

import { queryClient } from "@/main.js";
import { setBackdrop } from "@/utils/store/backdrop.js";
import { blue } from "@mui/material/colors";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_api/login/manual")({
	component: UserLoginManual,
});

function UserLoginManual() {
	const [loading, setLoading] = useState(false);
	const [quickConnectLoading, setQuickConnectLoading] = useState(-1);
	const [quickConnectCode, setQuickConnectCode] = useState("");
	const [rememberMe, setRememberMe] = useState(true);
	const api = Route.useRouteContext().api;

	const server = useQuery({
		queryKey: ["login", "manual", "serverInfo"],
		queryFn: async () => {
			return (await getBrandingApi(api).getBrandingOptions()).data;
		},
	});

	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();

	const [password, setPassword] = useState({
		showpass: false,
	});
	const [userName, setUserName] = useState("");

	const handleUsername = (event) => {
		setUserName(event.target.value);
	};

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

	const authUser = async () => {
		try {
			const auth = await api.authenticateUserByName(
				userName,
				password.password,
			);
			return auth;
		} catch (error) {
			enqueueSnackbar("Incorrect Username or Password!", {
				variant: "error",
			});
			setLoading(false);
			console.error(error);
		}
	};

	const handleLogin = async () => {
		setLoading(true);
		const user = await authUser();
		sessionStorage.setItem("accessToken", user.data.AccessToken);
		createApi(api.basePath, user.data.AccessToken);
		if (rememberMe === true) {
			await saveUser(userName, user.data.AccessToken);
		}
		setLoading(false);
		navigate("/home");
	};

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
			<Container
				maxWidth="xs"
				sx={{
					height: "100vh",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Grid
					container
					spacing={2}
					direction="column"
					justifyContent="center"
					alignItems="center"
					sx={{
						transition: "opacity 200ms",
						width: "100%",
					}}
				>
					<Grid sx={{ marginBottom: "1em" }}>
						<Typography variant="h3" color="textPrimary">
							Login
						</Typography>
					</Grid>
					<Grid sx={{ width: "100%", mb: 1 }}>
						<FormControl sx={{ width: "100%" }} variant="outlined">
							<InputLabel htmlFor="user-name">Username:</InputLabel>
							<OutlinedInput
								fullWidth
								id="user-name"
								type="text"
								variant="outlined"
								label="Username:"
								onChange={handleUsername}
							/>
						</FormControl>
					</Grid>
					<Grid sx={{ width: "100%" }}>
						<FormGroup>
							<FormControl sx={{ width: "100%" }} variant="outlined">
								<InputLabel htmlFor="user-password">Password:</InputLabel>
								<OutlinedInput
									fullWidth
									id="user-password"
									type={password.showpass ? "text" : "password"}
									variant="outlined"
									onChange={handlePassword("password")}
									onKeyUp={(event) => {
										if (event.key === "Enter") {
											handleLogin();
										}
									}}
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
						</FormGroup>
					</Grid>
					<div
						className="flex flex-column"
						style={{ width: "100%", gap: "0.4em" }}
					>
						<LoadingButton
							variant="contained"
							endIcon={
								<span className="material-symbols-rounded">chevron_right</span>
							}
							onClick={handleLogin}
							loading={loading}
							loadingPosition="end"
							size="large"
							sx={{ width: "100%" }}
						>
							Login
						</LoadingButton>
						<LoadingButton
							onClick={handleQuickConnect}
							variant="contained"
							className="userEventButton"
							sx={{ width: "100%" }}
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
							sx={{ width: "100%" }}
							onClick={() => navigate("/servers/list")}
						>
							Change Server
						</Button>
					</div>
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
					<Grid sx={{ width: "100%" }}>
						{server.isSuccess && server.data.LoginDisclaimer && (
							<Paper
								elevation={5}
								style={{
									marginTop: "1em",
									padding: "1em",
									borderRadius: "15px",
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
					</Grid>
				</Grid>
			</Container>
		</>
	);
}
