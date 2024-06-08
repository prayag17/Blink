import LoadingButton from "@mui/lab/LoadingButton";
import { OutlinedInput, Paper, Typography } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";

import { useSnackbar } from "notistack";

import { AppBarBackOnly } from "@/components/appBar/backOnly.jsx";
import { AvatarImage } from "@/components/avatar/avatar.jsx";
import "./login.scss";

import { saveUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";
import { setBackdrop } from "@/utils/store/backdrop.js";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useLayoutEffect, useState } from "react";

export const Route = createFileRoute("/_api/login/$userId/$userName")({
	component: LoginUser,
});

function LoginUser() {
	const { userName, userId } = Route.useParams();

	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);

	const [password, setPassword] = useState({
		showpass: false,
	});
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);

	const navigate = useNavigate({ from: "/login/$userId/$userName" });

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
}
