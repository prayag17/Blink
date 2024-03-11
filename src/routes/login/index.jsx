import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EventEmitter as event } from "../../eventEmitter.js";

import { saveUser } from "../../utils/storage/user";

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
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";

import { useSnackbar } from "notistack";

import { AppBarBackOnly } from "../../components/appBar/backOnly.jsx";
import { AvatarImage } from "../../components/avatar/avatar.jsx";
import { Card } from "../../components/card/card";

import { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";
import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api/quick-connect-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice.jsx";
import { createApi, useApi } from "../../utils/store/api";
import "./login.module.scss";

import { setBackdrop } from "../../utils/store/backdrop.js";

export const LoginRoute = () => {
	const navigate = useNavigate();
	const [api] = useApi((state) => [state.api]);

	const usersList = useQuery({
		queryKey: ["public-users"],
		queryFn: async () => {
			const result = await getUserApi(api).getPublicUsers();
			return result.data;
		},
		enabled: Boolean(api),
	});

	if (usersList.isSuccess && !usersList.isFetching) {
		if (usersList.data.length > 0) {
			navigate("/login/users");
		} else {
			navigate("/login/manual");
		}
	}

	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
			}}
		>
			<CircularProgress size={72} thickness={1.4} />
		</div>
	);
};

export const LoginWithImage = () => {
	const { userName, userId } = useParams();

	const [api] = useApi((state) => [state.api]);

	const [password, setPassword] = useState({
		showpass: false,
	});
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);

	const navigate = useNavigate();

	const { enqueueSnackbar } = useSnackbar();

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
			if (error.response?.status === 500) {
				enqueueSnackbar(
					"Unable to connect to server. Please try again after some time.",
					{ variant: "error" },
				);
			} else {
				enqueueSnackbar("Incorrect Password.", { variant: "error" });
			}
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

	useLayoutEffect(() => {
		setBackdrop("", "");
	}, []);

	const handleCheckRememberMe = (event) => {
		setRememberMe(event.target.checked);
	};

	return (
		<>
			<AppBarBackOnly />
			<div
				style={{
					height: "100vh",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					flexDirection: "column",
					width: "30vw",
					margin: "auto",
				}}
			>
				<div
					style={{
						marginBottom: "-4em",
						boxShadow: "1em 0 hsl(256, 100%, 6%)",
					}}
				>
					<AvatarImage userId={userId} />
				</div>
				<Paper
					sx={{
						width: "100%",
						padding: "1em",
						paddingTop: "5em",
						borderRadius: "10px",
					}}
					elevation={2}
				>
					<Typography
						textAlign="center"
						variant="h5"
						sx={{ opacity: 0.8 }}
						mb={2}
					>
						Login as{" "}
						<Typography
							variant="h5"
							style={{
								display: "inline",
							}}
							fontWeight={700}
							className="gradient-text"
						>
							{userName}
						</Typography>
					</Typography>
					<FormGroup
						sx={{
							width: "100%",
						}}
					>
						<FormControl
							variant="outlined"
							style={{
								width: "100%",
							}}
						>
							<InputLabel htmlFor="user-password">Password:</InputLabel>
							<OutlinedInput
								id="user-password"
								type={password.showpass ? "text" : "password"}
								variant="outlined"
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
					</FormGroup>
					<LoadingButton
						variant="contained"
						endIcon={
							<span className="material-symbols-rounded">chevron_right</span>
						}
						onClick={handleLogin}
						loading={loading}
						loadingPosition="end"
						size="large"
						fullWidth
					>
						Login
					</LoadingButton>
				</Paper>
			</div>
		</>
	);
};

export const UserLogin = () => {
	const navigate = useNavigate();

	const { enqueueSnackbar } = useSnackbar();

	const [api] = useApi((state) => [state.api]);

	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [quickConnectLoading, setQuickConnectLoading] = useState(-1);
	const [quickConnectCode, setQuickConnectCode] = useState("");

	const handleCheckRememberMe = (event) => {
		setRememberMe(event.target.checked);
	};

	const handleChangeServer = () => {
		navigate("/servers/list");
	};
	const handleManualLogin = () => {
		navigate("/login/manual");
	};
	const users = useQuery({
		queryKey: ["login", "users"],
		queryFn: async () => {
			const users = await getUserApi(api).getPublicUsers();
			return users.data;
		},
		staleTime: 0,
	});

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
				setQuickConnectCode("");
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
				await saveUser(auth.data.User.Name, auth.data.AccessToken);
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

	if (users.isPending) {
		return <LinearProgress />;
	}

	if (users.isSuccess) {
		return (
			<>
				<AppBarBackOnly />
				<Container
					maxWidth="md"
					sx={{
						height: "100vh",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Typography variant="h3" mb={2}>
						Users
					</Typography>

					<Grid
						container
						columns={{
							xs: 2,
							sm: 3,
							md: 4,
						}}
						wrap="nowrap"
						alignItems="center"
						overflow="auto"
						width="100%"
						mb={3}
						paddingBottom={2}
						className="roundedScrollbar"
					>
						{users.data.map((item, index) => {
							return (
								<Grid
									key={item.Id}
									flexShrink={0}
									flexGrow={1}
									xs={1}
									sm={1}
									md={1}
								>
									<Card
										cardTitle={item.Name}
										item={item}
										disableOverlay
										itemType="User"
										cardType="square"
										onClick={() =>
											navigate(`/login/withImg/${item.Name}/${item.Id}/`)
										}
										overrideIcon="User"
										imageType="Primary"
									/>
								</Grid>
							);
						})}
					</Grid>

					<div className="buttons">
						<Button
							color="secondary"
							variant="contained"
							className="userEventButton"
							onClick={handleChangeServer}
						>
							Change Server
						</Button>
						<LoadingButton
							onClick={handleQuickConnect}
							variant="contained"
							className="userEventButton"
							sx={{ width: "100%" }}
							loading={quickConnectLoading === 1}
							size="large"
						>
							Quick Connect
						</LoadingButton>
						<Button
							variant="contained"
							className="userEventButton"
							onClick={handleManualLogin}
							size="small"
						>
							Manual Login
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
				</Container>
			</>
		);
	}
	if (users.isError) {
		return <ErrorNotice />;
	}
};

export const UserLoginManual = () => {
	const [loading, setLoading] = useState(false);
	const [quickConnectLoading, setQuickConnectLoading] = useState(-1);
	const [quickConnectCode, setQuickConnectCode] = useState("");
	const [rememberMe, setRememberMe] = useState(true);
	const [api] = useApi((state) => [state.api]);

	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();

	const [password, setPassword] = useState({
		showpass: false,
	});
	const [userName, setUserName] = useState("");

	const server = useQuery({
		queryKey: ["login, manual", "serverInfo"],
		queryFn: async () => {
			const result = await getBrandingApi(api).getBrandingOptions();
			return result.data;
		},
		networkMode: "always",
	});

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
			{server.isPending && <LinearProgress />}
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
						opacity: server.isPending ? 0 : 1,
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
						<Typography variant="subtitle2">
							{server.isSuccess && server.data.LoginDisclaimer}
						</Typography>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
