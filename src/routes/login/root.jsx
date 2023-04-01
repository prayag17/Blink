/** @format */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { EventEmitter as event } from "../../eventEmitter.js";

import { getServer } from "../../utils/storage/servers.js";
import { saveUser } from "../../utils/storage/user.js";

// import Icon from "mdi-material-ui";
import { MdiEyeOffOutline } from "../../components/icons/mdiEyeOffOutline";
import { MdiEyeOutline } from "../../components/icons/mdiEyeOutline";
import { MdiChevronRight } from "../../components/icons/mdiChevronRight";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import OutlinedInput from "@mui/material/OutlinedInput";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import { useSnackbar } from "notistack";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import { AvatarImage } from "../../components/avatar/avatar.jsx";
import { CardScroller } from "../../components/cardScroller/cardScroller.jsx";
import { Card } from "../../components/card/card.jsx";
import { AppBarBackOnly } from "../../components/appBar/backOnly.jsx";

// import { jellyfin } from "../../jellyfin";
// import getSystemApi from "@jellyfin/sdk";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";

import "./login.module.scss";
import { CardsSkeleton } from "../../components/skeleton/cards.jsx";

export const LoginWithImage = () => {
	const { userName, userId } = useParams();

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
			const auth = await window.api.authenticateUserByName(
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
		if (rememberMe == true) {
			saveUser(userName, password.password);
		}
		event.emit("set-api-accessToken", window.api.basePath);
		setLoading(false);
		navigate(`/home`);
	};

	const handleCheckRememberMe = (event) => {
		setRememberMe(event.target.checked);
	};

	return (
		<>
			<AppBarBackOnly />
			<Container maxWidth="xs" className="centered">
				<Grid
					container
					direction="column"
					justifyContent="center"
					alignItems="center"
					spacing={2}
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
						>
							Login
							<br />
						</Typography>
					</Grid>
					<Grid
						container
						direction="column"
						justifyContent="center"
						alignItems="center"
					>
						<AvatarImage userId={userId} />
						<Typography
							color="textPrimary"
							textAlign="center"
							variant="h4"
						>
							{userName}
						</Typography>
					</Grid>
					<Grid item minWidth="100%">
						<FormGroup>
							<FormControl variant="outlined" fullWidth>
								<InputLabel htmlFor="user-password">
									Password:
								</InputLabel>
								<OutlinedInput
									id="user-password"
									type={
										password.showpass
											? "text"
											: "password"
									}
									variant="outlined"
									onChange={handlePassword(
										"password",
									)}
									label="Password:"
									endAdornment={
										<InputAdornment position="end">
											<IconButton
												onClick={
													handleShowPassword
												}
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
										onChange={
											handleCheckRememberMe
										}
									/>
								}
								label="Remember me"
							/>
						</FormGroup>
					</Grid>
					<Grid item minWidth="100%">
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
	const [userList, setUsers] = useState([]);
	const navigate = useNavigate();

	const handleChangeServer = () => {
		navigate("/servers/list");
	};
	const handleManualLogin = () => {
		navigate("/login/manual");
	};
	const users = useQuery({
		queryKey: ["login", "users"],
		queryFn: async () => {
			const users = await getUserApi(window.api).getPublicUsers();
			// console.log(users.data);
			return users.data;
			// return {};
		},
	});

	return (
		<>
			<AppBarBackOnly />
			<Container maxWidth="md" className="centered">
				{/* <Typography variant="h3" sx={{ marginBottom: "1em" }}>
					Users
				</Typography> */}
				{users.isLoading ? (
					<CardsSkeleton />
				) : (
					<CardScroller displayCards={5} title="Users">
						{users.data.map((item, index) => {
							return (
								//
								<Link
									to={`/login/withImg/${item.Name}/${item.Id}/`}
									key={item.Id}
									className="userCard"
									index={index}
								>
									<Card
										key={index}
										itemName={item.Name}
										itemId={item.Id}
										imageTags={
											!!item.PrimaryImageTag
										}
										// cardType="sqaure"
										iconType="Person"
										cardOrientation="sqaure"
									/>
								</Link>
							);
						})}
					</CardScroller>
				)}
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
						onClick={handleManualLogin}
					>
						Manual Login
					</Button>
				</div>
			</Container>
		</>
	);
};

export const UserLoginManual = () => {
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);

	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();

	const [password, setPassword] = useState({
		showpass: false,
	});
	const [userName, setUserName] = useState("");

	const server = useQuery({
		queryKey: ["login, manual", "serverInfo"],
		queryFn: async () => {
			const result = await getBrandingApi(
				window.api,
			).getBrandingOptions();
			return result.data;
		},
		enabled: !window.api,
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
			const auth = await window.api.authenticateUserByName(
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
		if (rememberMe == true) {
			saveUser(userName, password.password);
		}
		event.emit("set-api-accessToken", window.api.basePath);
		// setAccessToken(user.data.AccessToken)
		setLoading(false);
		navigate(`/home`);
	};

	const handleCheckRememberMe = (event) => {
		setRememberMe(event.target.checked);
	};

	return (
		<>
			<AppBarBackOnly />
			<Container maxWidth="xs" className="centered">
				<Grid
					container
					spacing={2}
					direction="column"
					justifyContent="center"
					alignItems="center"
				>
					<Grid item xl={5} md={6} sx={{ marginBottom: "1em" }}>
						<Typography variant="h3" color="textPrimary">
							Login
						</Typography>
					</Grid>
					<Grid sx={{ width: "100%" }} item xl={5} md={6}>
						<FormControl
							sx={{ width: "100%" }}
							variant="outlined"
						>
							<InputLabel htmlFor="user-name">
								Username:
							</InputLabel>
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
					<Grid sx={{ width: "100%" }} item xl={5} md={6}>
						<FormGroup>
							<FormControl
								sx={{ width: "100%" }}
								variant="outlined"
							>
								<InputLabel htmlFor="user-password">
									Password:
								</InputLabel>
								<OutlinedInput
									fullWidth
									id="user-password"
									type={
										password.showpass
											? "text"
											: "password"
									}
									variant="outlined"
									onChange={handlePassword(
										"password",
									)}
									label="Password:"
									endAdornment={
										<InputAdornment position="end">
											<IconButton
												onClick={
													handleShowPassword
												}
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
										onChange={
											handleCheckRememberMe
										}
									/>
								}
								label="Remember me"
							/>
						</FormGroup>
					</Grid>
					<Grid item xl={5} md={6} sx={{ width: "100%" }}>
						<LoadingButton
							variant="contained"
							endIcon={<MdiChevronRight />}
							onClick={handleLogin}
							loading={loading}
							loadingPosition="end"
							size="large"
							sx={{ width: "100%" }}
						>
							Login
						</LoadingButton>
					</Grid>
					<Grid item xl={15} md={6} sx={{ width: "100%" }}>
						<Typography variant="subtitle2">
							{server.isSuccess &&
								server.data.LoginDisclaimer}
						</Typography>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
