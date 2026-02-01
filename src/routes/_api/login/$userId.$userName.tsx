import LoadingButton from "@mui/lab/LoadingButton";
import { Paper, TextField, Typography } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

import { useSnackbar } from "notistack";

import { AvatarImage } from "@/components/avatar/avatar.jsx";
import "./login.scss";

import { useMutation } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import React, {
	type ChangeEvent,
	type FormEvent,
	useEffect,
	useState,
} from "react";
import { useShallow } from "zustand/shallow";
import { saveUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop.js";

export const Route = createFileRoute("/_api/login/$userId/$userName")({
	component: LoginUser,
});

type PasswordState = {
	showpass: boolean;
	password: string | undefined;
};

function LoginUser() {
	const { userName, userId } = Route.useParams();

	const router = useRouter();

	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);

	const [password, setPassword] = useState<PasswordState>({
		showpass: false,
		password: undefined,
	});
	const [rememberMe, setRememberMe] = useState(true);

	const navigate = useNavigate({ from: "/login/$userId/$userName" });

	const { enqueueSnackbar } = useSnackbar();

	const handlePassword =
		(prop: "password" | "showPassord") =>
		(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

	const setBackdrop = useBackdropStore(
		useShallow((state) => state.setBackdrop),
	);

	useEffect(() => {
		if (!api) {
			return;
		}
		setBackdrop("");
	}, []);

	const handleCheckRememberMe = (
		_: ChangeEvent<HTMLInputElement>,
		checked: boolean,
	) => {
		setRememberMe(checked);
	};

	const handleLoginFn = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			if (!api) {
				throw new Error("API not initialized");
			}
			const authenticate = await api.authenticateUserByName(
				userName,
				password.password,
			);
			if (!authenticate.data.AccessToken) {
				throw new Error("No access token received");
			}
			createApi(api.basePath, authenticate.data?.AccessToken);

			if (authenticate.data.SessionInfo?.UserId && rememberMe) {
				await saveUser(
					userName,
					authenticate.data.AccessToken,
					authenticate.data.SessionInfo.UserId,
				);
			}

			router.invalidate().finally(() => {
				navigate({ to: "/home", replace: true });
			});
		} catch (err) {
			console.error(err);
			enqueueSnackbar("Unable to authenticate! Please check your password", {
				variant: "error",
			});
		}
		return;
	};

	const handleLogin = useMutation({
		mutationKey: ["login", "authenticate"],
		mutationFn: handleLoginFn,
	});

	return (
		<div
			className="login flex flex-center flex-column centered"
			style={{ marginTop: 0 }}
		>
			<Paper
				sx={{
					p: 4,
					width: "100%",
					maxWidth: "600px",
					backgroundColor: "rgba(20, 20, 30, 0.7)",
					backdropFilter: "blur(24px) saturate(180%)",
					backgroundImage:
						"linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
					borderRadius: 4,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<div
					style={{
						marginBottom: "2em",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "1em",
					}}
				>
					<AvatarImage userId={userId} />
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						<Typography variant="body1" sx={{ opacity: 0.7 }}>
							Login as
						</Typography>
						<Typography variant="h5" fontWeight={700} className="gradient-text">
							{userName}
						</Typography>
					</div>
				</div>

				<form
					onSubmit={(e) => handleLogin.mutate(e)}
					style={{
						width: "100%",
						display: "flex",
						flexDirection: "column",
						gap: "1.5rem",
					}}
				>
					<TextField
						fullWidth
						type={password.showpass ? "text" : "password"}
						onChange={handlePassword("password")}
						label="Password"
						variant="outlined"
						autoFocus
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<span
										className="material-symbols-rounded"
										style={{ opacity: 0.5 }}
									>
										key
									</span>
								</InputAdornment>
							),
							endAdornment: (
								<InputAdornment position="end">
									<IconButton onClick={handleShowPassword} edge="end">
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
							),
						}}
					/>

					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<FormControlLabel
							control={
								<Checkbox
									checked={rememberMe}
									onChange={handleCheckRememberMe}
								/>
							}
							label="Remember me"
							sx={{ m: 0 }}
						/>
					</div>

					<LoadingButton
						variant="contained"
						endIcon={<span className="material-symbols-rounded">login</span>}
						type="submit"
						loading={handleLogin.isPending}
						loadingPosition="end"
						size="large"
						fullWidth
						sx={{ borderRadius: 2, height: 48 }}
					>
						Login
					</LoadingButton>
				</form>
			</Paper>
		</div>
	);
}
