import LoadingButton from "@mui/lab/LoadingButton";
import { OutlinedInput, Typography } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";

import { useSnackbar } from "notistack";

import { AvatarImage } from "@/components/avatar/avatar.jsx";
import "./login.scss";

import { saveUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop.js";
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

	const setBackdrop = useBackdropStore((state) => state.setBackdrop);

	useEffect(() => {
		if (!api) {
			return;
		}
		setBackdrop("", "");
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

			if (rememberMe) await saveUser(userName, authenticate.data.AccessToken);

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
			<AvatarImage userId={userId} />
			<div style={{ display: "inline-flex", margin: "1em 0" }}>
				<Typography variant="h5">Login as</Typography>
				<Typography
					variant="h5"
					style={{
						display: "inline",
					}}
					ml={0.5}
					fontWeight={700}
					className="gradient-text"
				>
					{userName}
				</Typography>
			</div>
			<form onSubmit={(e) => handleLogin.mutate(e)}>
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
						onChange={handlePassword("password")}
						label="Password:"
						endAdornment={
							<InputAdornment position="end">
								<IconButton
									onClick={handleShowPassword}
									aria-label="toggle password visibility"
								>
									{password.showpass ? (
										<span className="material-symbols-rounded">visibility</span>
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
						<Checkbox checked={rememberMe} onChange={handleCheckRememberMe} />
					}
					label="Remember me"
				/>
				<LoadingButton
					variant="contained"
					endIcon={
						<span className="material-symbols-rounded">chevron_right</span>
					}
					type="submit"
					loading={handleLogin.isPending}
					loadingPosition="end"
					size="large"
					fullWidth
				>
					Login
				</LoadingButton>
			</form>
		</div>
	);
}
