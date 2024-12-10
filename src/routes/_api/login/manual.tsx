import { useMutation, useQuery } from "@tanstack/react-query";
import React, {
	type ChangeEvent,
	type FormEvent,
	useEffect,
	useState,
} from "react";

import { saveUser } from "@/utils/storage/user.js";

import LoadingButton from "@mui/lab/LoadingButton";
import { OutlinedInput, Paper, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";

import { useSnackbar } from "notistack";

import { useApiInContext } from "@/utils/store/api.js";
import { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";
import "./login.scss";

import { useBackdropStore } from "@/utils/store/backdrop.js";
import { blue } from "@mui/material/colors";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_api/login/manual")({
	component: UserLoginManual,
	validateSearch: (search): { redirect?: string } => {
		return { redirect: String(search.redirect) };
	},
});

function UserLoginManual() {
	const [rememberMe, setRememberMe] = useState(true);
	// console.log(Route.useRouteContext());
	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);
	const router = useRouter();
	const searchParams = Route.useSearch();

	const server = useQuery({
		queryKey: ["login", "manual", "serverInfo"],
		queryFn: async () =>
			api ? (await getBrandingApi(api).getBrandingOptions()).data : null,
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

	const handlePassword =
		(prop: "password" | "showpass") =>
		(event: ChangeEvent<HTMLInputElement>) => {
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
			if (!api) {
				throw new Error("Api is not available");
			}
			const authenticate = await api.authenticateUserByName(
				username,
				password.password,
			);
			if (!authenticate.data?.AccessToken) {
				throw new Error("Access token not available");
			}
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

	const handleCheckRememberMe = (
		_: ChangeEvent<HTMLInputElement>,
		checked: boolean,
	) => {
		setRememberMe(checked);
	};

	const setBackdrop = useBackdropStore((state) => state.setBackdrop);
	useEffect(() => {
		setBackdrop("", "");
	}, []);

	return (
		<div className="login scrollY">
			<div
				className={`login-form-container ${
					server.data?.LoginDisclaimer && "padded-top"
				}`}
			>
				<Typography variant="h4" color="textPrimary">
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
							<Checkbox checked={rememberMe} onChange={handleCheckRememberMe} />
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
						<Button
							color="secondary"
							variant="contained"
							className="userEventButton"
							// size="large"
							style={{ flex: 1 }}
							onClick={() => navigate({ to: "/setup/server/list" })}
						>
							Change Server
						</Button>
					</div>
				</form>
			</div>
			{server.isSuccess && server.data?.LoginDisclaimer && (
				<Paper
					elevation={0}
					style={{
						marginTop: "1em",
						padding: "1em",
						borderRadius: "15px",
						width: "28em",
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
								//@ts-ignore
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
		</div>
	);
}
