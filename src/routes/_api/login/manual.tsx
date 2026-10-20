import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useMutation } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import React, { type FormEvent, useState } from "react";
import LoginShell from "@/components/loginShell";
import { saveUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";

export const Route = createFileRoute("/_api/login/manual")({
	component: UserLoginManual,
	validateSearch: (search): { redirect?: string } => {
		return { redirect: search.redirect ? String(search.redirect) : undefined };
	},
});

function UserLoginManual() {
	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);
	const router = useRouter();
	const navigate = useNavigate();
	const searchParams = Route.useSearch();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleLogin = useMutation({
		mutationKey: ["login", "authenticate"],
		mutationFn: async () => {
			if (!api) throw new Error("Api is not available");
			const authenticate = await api.authenticateUserByName(
				username.trim(),
				password,
			);
			if (!authenticate.data?.AccessToken) {
				throw new Error("Access token not available");
			}
			createApi(api.basePath, authenticate.data.AccessToken);
			if (rememberMe) {
				await saveUser(
					username.trim(),
					authenticate.data.AccessToken,
					authenticate.data.User?.Id ?? "",
				);
			}
		},
		onSuccess: () => {
			router.invalidate().finally(() => {
				navigate({ to: searchParams.redirect || "/home", replace: true });
			});
		},
		onError: (err) => {
			console.error(err);
			setError("Incorrect username or password.");
			setPassword("");
		},
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!username.trim()) {
			setError("Enter your username.");
			return;
		}
		setError(null);
		handleLogin.mutate();
	};

	return (
		<LoginShell
			title="Sign in"
			subtitle="Use your username and password"
			footer={
				<Link to="/login/list" className="login-link">
					<span className="material-symbols-rounded">group</span>
					Choose a profile instead
				</Link>
			}
		>
			<form className="login-form" onSubmit={handleSubmit} noValidate>
				<TextField
					fullWidth
					autoFocus
					label="Username"
					variant="outlined"
					autoComplete="username"
					value={username}
					onChange={(e) => {
						setUsername(e.target.value);
						setError(null);
					}}
					error={Boolean(error) && !username.trim()}
				/>
				<TextField
					fullWidth
					label="Password"
					variant="outlined"
					type={showPassword ? "text" : "password"}
					autoComplete="current-password"
					value={password}
					onChange={(e) => {
						setPassword(e.target.value);
						setError(null);
					}}
					error={Boolean(error) && Boolean(username.trim())}
					helperText={error ?? "Leave blank if your account has no password"}
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
