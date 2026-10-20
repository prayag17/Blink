import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import React, { type FormEvent, useState } from "react";
import LoginShell from "@/components/loginShell";
import {
	getPublicUsersQueryOptions,
	isPasswordProtected,
	ProfileAvatar,
} from "@/components/loginShell/profileAvatar";
import { saveUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";

export const Route = createFileRoute("/_api/login/$userId/$userName")({
	component: LoginUser,
});

function LoginUser() {
	const { userName, userId } = Route.useParams();
	const router = useRouter();
	const navigate = useNavigate({ from: "/login/$userId/$userName" });

	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);

	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Profile details (image, whether a password is needed) from the public user list
	const users = useQuery(getPublicUsersQueryOptions(api));
	const user = users.data?.find((u) => u.Id === userId);
	const needsPassword = isPasswordProtected(user);

	const handleLogin = useMutation({
		mutationKey: ["login", "authenticate"],
		mutationFn: async () => {
			if (!api) throw new Error("API not initialized");
			const authenticate = await api.authenticateUserByName(userName, password);
			if (!authenticate.data.AccessToken) {
				throw new Error("No access token received");
			}
			createApi(api.basePath, authenticate.data.AccessToken);
			if (authenticate.data.SessionInfo?.UserId && rememberMe) {
				await saveUser(
					userName,
					authenticate.data.AccessToken,
					authenticate.data.SessionInfo.UserId,
				);
			}
		},
		onSuccess: () => {
			router.invalidate().finally(() => {
				navigate({ to: "/home", replace: true });
			});
		},
		onError: (err) => {
			console.error(err);
			setError(
				needsPassword
					? "Incorrect password. Please try again."
					: "Couldn't sign in. Please try again.",
			);
			setPassword("");
		},
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		handleLogin.mutate();
	};

	return (
		<LoginShell
			title={`Welcome back, ${userName}`}
			subtitle={
				needsPassword
					? "Enter your password to continue"
					: "This profile doesn't need a password"
			}
			footer={
				<Link to="/login/list" className="login-link">
					<span className="material-symbols-rounded">switch_account</span>
					Not you? Switch user
				</Link>
			}
		>
			<form className="login-form" onSubmit={handleSubmit}>
				<div className="login-form-avatar">
					<ProfileAvatar
						userId={userId}
						name={userName}
						imageTag={user?.PrimaryImageTag}
					/>
				</div>

				{needsPassword && (
					<TextField
						fullWidth
						autoFocus
						label="Password"
						variant="outlined"
						type={showPassword ? "text" : "password"}
						autoComplete="current-password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							setError(null);
						}}
						error={Boolean(error)}
						helperText={error}
						slotProps={{
							input: {
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											onClick={() => setShowPassword((show) => !show)}
											edge="end"
											aria-label={
												showPassword ? "Hide password" : "Show password"
											}
										>
											<span className="material-symbols-rounded">
												{showPassword ? "visibility_off" : "visibility"}
											</span>
										</IconButton>
									</InputAdornment>
								),
							},
						}}
					/>
				)}
				{!needsPassword && error && (
					<p className="login-shell-subtitle" role="alert">
						{error}
					</p>
				)}

				<div className="login-form-options">
					<FormControlLabel
						control={
							<Checkbox
								checked={rememberMe}
								onChange={(_, checked) => setRememberMe(checked)}
							/>
						}
						label="Keep me signed in"
					/>
				</div>

				<Button
					className="login-form-submit"
					variant="contained"
					type="submit"
					size="large"
					fullWidth
					loading={handleLogin.isPending || handleLogin.isSuccess}
				>
					Sign in
				</Button>
			</form>
		</LoginShell>
	);
}
