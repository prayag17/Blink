import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EventEmitter as event } from "../../eventEmitter.js";

import { saveUser } from "../../utils/storage/user";

import { MdiChevronRight } from "../../components/icons/mdiChevronRight.jsx";
// import Icon from "mdi-material-ui";
import { MdiEyeOffOutline } from "../../components/icons/mdiEyeOffOutline.jsx";
import { MdiEyeOutline } from "../../components/icons/mdiEyeOutline.jsx";

import LoadingButton from "@mui/lab/LoadingButton";
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
import OutlinedInput from "@mui/material/OutlinedInput";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import { useSnackbar } from "notistack";

import { AppBarBackOnly } from "../../components/appBar/backOnly.jsx";
import { AvatarImage } from "../../components/avatar/avatar.jsx";
import { Card } from "../../components/card/card.jsx";

import { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";
import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api/quick-connect-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice.jsx";
import { useApi } from "../../utils/store/api";
import "./login.module.scss";

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
			enqueueSnackbar("Incorrect Password!", { variant: "error" });
			setLoading(false);
			console.error(error);
		}
	};

	const handleLogin = async () => {
		setLoading(true);
		const user = await authUser();
		sessionStorage.setItem("accessToken", user.data.AccessToken);
		if (rememberMe === true) {
			saveUser(userName, user.data.AccessToken);
		}
		event.emit("set-api-accessToken", api.basePath);
		setLoading(false);
		navigate("/home");
	};

	const handleCheckRememberMe = (event) => {
		setRememberMe(event.target.checked);
	};

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
					direction="column"
					justifyContent="center"
					alignItems="center"
					spacing={2}
					width="100%"
				>
					<Grid
						container
						direction="column"
						justifyContent="center"
						alignItems="center"
						marginBottom={2}
					>
						<Typography
							textAlign="center"
							variant="h3"
							color="textPrimary"
							mb={2}
						>
							Login
						</Typography>
					</Grid>
					<Grid
						container
						direction="column"
						justifyContent="center"
						alignItems="center"
						mb={1}
					>
						<AvatarImage userId={userId} />
						<Typography color="textPrimary" textAlign="center" variant="h4">
							{userName}
						</Typography>
					</Grid>
					<Grid minWidth="100%">
						<FormGroup>
							<FormControl variant="outlined" fullWidth>
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
													<MdiEyeOffOutline />
												) : (
													<MdiEyeOutline />
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
					<Grid minWidth="100%">
						<LoadingButton
							variant="contained"
							endIcon={<MdiChevronRight />}
							onClick={handleLogin}
							loading={loading}
							loadingPosition="end"
							size="large"
							fullWidth
						>
							Login
						</LoadingButton>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};

export const UserLogin = () => {
	const navigate = useNavigate();

	const { enqueueSnackbar } = useSnackbar();

	const [api] = useApi((state) => [state.api]);

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
		gcTime: 0,
	});

	const handleInitiateQuickConnect = useMutation({
		mutationKey: ["quick-connect"],
		mutationFn: async () => {
			console.log(api);
			const result = await getQuickConnectApi(api).initiate();
			return result.data;
		},
		onSuccess: (data) => {
			console.info(data);
		},
		onError: (error) => {
			console.error(error);
			enqueueSnackbar("Unable to use Quick Connect", {
				variant: "error",
			});
		},
	});

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
						<Button
							variant="contained"
							className="userEventButton"
							onClick={handleInitiateQuickConnect.mutate}
							// disabled
						>
							Quick Connect
						</Button>
						<Button
							variant="contained"
							className="userEventButton"
							onClick={handleManualLogin}
						>
							Manual Login
						</Button>
					</div>
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
		if (rememberMe === true) {
			saveUser(userName, user.data.AccessToken);
		}
		event.emit("set-api-accessToken", api.basePath);
		// setAccessToken(user.data.AccessToken)
		setLoading(false);
		navigate("/home");
	};

	const handleCheckRememberMe = (event) => {
		setRememberMe(event.target.checked);
	};

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
					<Grid sx={{ width: "100%" }}>
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
													<MdiEyeOffOutline />
												) : (
													<MdiEyeOutline />
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
					<Grid sx={{ width: "100%" }}>
						<LoadingButton
							variant="contained"
							endIcon={<MdiChevronRight />}
							onClick={handleLogin}
							loading={loading}
							loadingPosition="end"
							size="large"
							sx={{ width: "100%", mb: 1 }}
						>
							Login
						</LoadingButton>
						<Button
							color="secondary"
							variant="contained"
							className="userEventButton"
							size="large"
							sx={{ width: "100%" }}
							onClick={() => navigate("/servers/list")}
						>
							Change Server
						</Button>
					</Grid>
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
