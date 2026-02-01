import { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";
import LoadingButton from "@mui/lab/LoadingButton";
import { Paper, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import React, {
	type ChangeEvent,
	type FormEvent,
	useEffect,
	useState,
} from "react";
import { saveUser } from "@/utils/storage/user.js";
import { useApiInContext } from "@/utils/store/api.js";
import "./login.scss";

import { blue } from "@mui/material/colors";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useShallow } from "zustand/shallow";
import { useBackdropStore } from "@/utils/store/backdrop.js";

export const Route = createFileRoute("/_api/login/manual")({
	component: UserLoginManual,
	validateSearch: (search): { redirect?: string } => {
		return { redirect: search.redirect ? String(search.redirect) : undefined };
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

			if (rememberMe)
				await saveUser(
					username,
					authenticate.data.AccessToken,
					authenticate.data.User?.Id ?? "",
				);
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

	const setBackdrop = useBackdropStore(
		useShallow((state) => state.setBackdrop),
	);
	useEffect(() => {
		setBackdrop("");
	}, []);

	return (
		<div className="login scrollY flex flex-center flex-column">
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
					gap: 3,
					mb: 3,
				}}
			>
				<Typography variant="h4" fontWeight="bold" align="center">
					Login
				</Typography>
				<form
					className="flex flex-column"
					style={{ gap: "1.5em", width: "100%" }}
					onSubmit={(e) => handleLogin.mutate(e)}
				>
					<TextField
						variant="outlined"
						label="Username" // Label helps accessibility, theme handles style
						fullWidth
						onChange={(e) => setUsername(e.currentTarget.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<span
										className="material-symbols-rounded"
										style={{ opacity: 0.5 }}
									>
										person
									</span>
								</InputAdornment>
							),
						}}
					/>
					<TextField
						fullWidth
						type={password.showpass ? "text" : "password"}
						onChange={handlePassword("password")}
						label="Password"
						variant="outlined"
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
									<IconButton
										onClick={handleShowPassword}
										edge="end"
										sx={{
											color: "rgba(255,255,255,0.7)",
											"&:hover": { color: "#fff" },
										}}
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
							),
						}}
					/>

					<FormControlLabel
						control={
							<Checkbox
								checked={rememberMe}
								onChange={handleCheckRememberMe}
								sx={{
									color: "rgba(255,255,255,0.5)",
									"&.Mui-checked": {
										color: "primary.main",
									},
								}}
							/>
						}
						label={
							<Typography variant="body2" sx={{ opacity: 0.7 }}>
								Remember me
							</Typography>
						}
					/>

					<div className="flex flex-column" style={{ gap: "1em" }}>
						<LoadingButton
							variant="contained"
							type="submit"
							loading={handleLogin.isPending}
							sx={{ width: "100%", height: 48, borderRadius: 2 }}
							size="large"
						>
							Login
						</LoadingButton>
						<Button
							color="inherit"
							variant="text"
							sx={{
								width: "100%",
								color: "rgba(255,255,255,0.5)",
								"&:hover": {
									color: "white",
									bgcolor: "rgba(255,255,255,0.05)",
								},
							}}
							onClick={() => navigate({ to: "/setup/server/list" })}
						>
							Change Server
						</Button>
					</div>
				</form>
			</Paper>
			{server.isSuccess && server.data?.LoginDisclaimer && (
				<Paper
					elevation={0}
					sx={{
						padding: "1.5em",
						borderRadius: "16px",
						width: "100%",
						maxWidth: "450px",
						backgroundColor: "rgba(33, 150, 243, 0.1)",
						border: "1px solid rgba(33, 150, 243, 0.2)",
					}}
				>
					<div
						className="flex flex-row flex-align-center"
						style={{ gap: "0.5em", marginBottom: "0.5em" }}
					>
						<span
							className="material-symbols-rounded"
							style={{
								color: blue[400],
							}}
						>
							info
						</span>
						<Typography variant="subtitle1" fontWeight="bold">
							Notice
						</Typography>
					</div>
					<Typography variant="body2" style={{ opacity: 0.8, lineHeight: 1.6 }}>
						{server.data.LoginDisclaimer}
					</Typography>
				</Paper>
			)}
		</div>
	);
}
