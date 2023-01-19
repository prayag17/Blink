/** @format */

import { useState, useEffect } from "react";
import { Cookies, useCookies } from "react-cookie";
import { useNavigate, useParams, Link } from "react-router-dom";
import { EventEmitter as event } from "../../eventEmitter.js";
import { motion } from "framer-motion";

// import Icon from "mdi-material-ui";
import EyeOffOutline from "mdi-material-ui/EyeOffOutline";
import EyeOutline from "mdi-material-ui/EyeOutline";
import ChevronRight from "mdi-material-ui/ChevronRight";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import OutlinedInput from "@mui/material/OutlinedInput";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import { useSnackbar } from "notistack";

import { AvatarCard, AvatarImage } from "../../components/avatar/avatar.jsx";
import { AppBarBackOnly } from "../../components/appBar/backOnly.jsx";

// import { jellyfin } from "../../jellyfin";
// import getSystemApi from "@jellyfin/sdk";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import "./login.module.scss";

export const LoginWithImage = () => {
	const { userName, userId } = useParams();
	const [password, setPassword] = useState({
		showpass: false,
	});
	const [loading, setLoading] = useState(false);
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
		event.emit("set-api-accessToken", window.api.basePath);
		// setAccessToken(user.data.AccessToken)
		setLoading(false);
		navigate(`/home`);
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
					<Grid item marginBottom={2}>
						<Typography
							textAlign="center"
							variant="h3"
							color="textPrimary"
						>
							Login
							<br />
						</Typography>
					</Grid>
					<Grid item>
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
						<br />
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
								onChange={handlePassword("password")}
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
												<EyeOffOutline />
											) : (
												<EyeOutline />
											)}
										</IconButton>
									</InputAdornment>
								}
							/>
						</FormControl>
					</Grid>
					<Grid item minWidth="100%">
						<LoadingButton
							variant="contained"
							endIcon={<ChevronRight />}
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
	const cookies = new Cookies();

	const currentServer = cookies.get("currentServer");
	const serverList = cookies.get("servers");

	const handleChangeServer = () => {
		navigate("/servers/list");
	};
	const handleManualLogin = () => {
		navigate("/login/manual");
	};
	const getUsers = async () => {
		const users = await getUserApi(window.api).getPublicUsers();
		// console.log(users.data);
		return users;
		// return {};
	};
	useEffect(() => {
		getUsers().then((users) => {
			setUsers(users.data);
		});
	});

	return (
		<>
			<AppBarBackOnly />
			<Container maxWidth="md" className="centered">
				<h1 color="white">WIP-user login</h1>
				<div className="userList">
					{userList.map((item, index) => {
						return (
							//
							<Link
								to={`/login/withImg/${item.Name}/${item.Id}/`}
								key={item.Id}
								className="userCard"
								index={index}
							>
								{item.ImageTags == undefined ? (
									<AvatarCard
										userName={item.Name}
										userId={item.Id}
										userImageAvailable={false}
									></AvatarCard>
								) : (
									<AvatarCard
										userName={item.Name}
										userImageAvailable={true}
									></AvatarCard>
								)}
							</Link>
						);
					})}
				</div>
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
		event.emit("set-api-accessToken", window.api.basePath);
		// setAccessToken(user.data.AccessToken)
		setLoading(false);
		navigate(`/home`);
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
								onChange={handlePassword("password")}
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
												<EyeOffOutline />
											) : (
												<EyeOutline />
											)}
										</IconButton>
									</InputAdornment>
								}
							/>
						</FormControl>
					</Grid>
					<Grid item xl={5} md={6} sx={{ width: "100%" }}>
						<LoadingButton
							variant="contained"
							endIcon={<ChevronRight />}
							onClick={handleLogin}
							loading={loading}
							loadingPosition="end"
							size="large"
							sx={{ width: "100%" }}
						>
							Login
						</LoadingButton>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
