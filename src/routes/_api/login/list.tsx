import { EventEmitter as event } from "@/eventEmitter.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useLayoutEffect, useState } from "react";

import { saveUser } from "@/utils/storage/user.js";

import LoadingButton from "@mui/lab/LoadingButton";
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	Grid,
	OutlinedInput,
	Paper,
	Tooltip,
	Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import LinearProgress from "@mui/material/LinearProgress";

import { useSnackbar } from "notistack";

import { AppBarBackOnly } from "@/components/appBar/backOnly.jsx";
import { Card } from "@/components/card/card.js";

import { getQuickConnectApi } from "@jellyfin/sdk/lib/utils/api/quick-connect-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice.jsx";
import "./login.scss";

import { useApiInContext } from "@/utils/store/api";
import { setBackdrop } from "@/utils/store/backdrop.js";
import { blue } from "@mui/material/colors";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_api/login/list")({
	component: LoginPublicUsersList,
	loader: async ({context}) => {
		const api = context.api;
		const result = await getUserApi(api).getPublicUsers();
		return result.data;
	},
});

function LoginPublicUsersList() {
	const navigate = useNavigate();

	const { enqueueSnackbar } = useSnackbar();

	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);

	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [quickConnectLoading, setQuickConnectLoading] = useState(-1);
	const [quickConnectCode, setQuickConnectCode] = useState("");

	const handleCheckRememberMe = (event) => {
		setRememberMe(event.target.checked);
	};

	const handleChangeServer = () => {
		// navigate("/servers/list");
	};
	const handleManualLogin = () => {
		// navigate("/login/manual");
	};
	const users = Route.useLoaderData();

	const handleQuickConnect = async () => {
		setQuickConnectLoading(0);

		const quickApi = getQuickConnectApi(api);

		const headers = {
			"X-Emby-Authorization": `MediaBrowser Client="${api.clientInfo.name}", Device="${api.deviceInfo.name}", DeviceId="${api.deviceInfo.id}", Version="${api.clientInfo.version}"`,
		};

		const quickConnectInitiation = await quickApi
			.initiate({
				headers,
			})
			.catch(() => ({ status: 401 }));

		if (quickConnectInitiation.status !== 200) {
			setQuickConnectLoading(-1);
			enqueueSnackbar("Unable to use Quick Connect", {
				variant: "error",
			});
			return;
		}

		setQuickConnectLoading(1);

		const { Secret, Code } = quickConnectInitiation.data;

		setQuickConnectCode(Code);

		const interval = setInterval(async () => {
			const quickConnectCheck = await quickApi
				.connect({
					secret: Secret,
				})
				.catch(() => ({ status: 401, data: { Authenticated: false } }));

			if (quickConnectCheck.status !== 200) {
				setQuickConnectCode("");
				enqueueSnackbar("Unable to use Quick Connect", {
					variant: "error",
				});

				setQuickConnectLoading(-1);
				clearInterval(interval);
				return;
			}

			if (!quickConnectCheck.data.Authenticated) {
				return;
			}

			const auth = await getUserApi(api)
				.authenticateWithQuickConnect({
					quickConnectDto: {
						Secret: Secret,
					},
				})
				.catch(() => ({ status: 401 }));

			api.accessToken = auth.data.AccessToken;

			clearInterval(interval);

			if (auth.status !== 200) {
				enqueueSnackbar("Unable to use Quick Connect", {
					variant: "error",
				});
				setQuickConnectLoading(-1);
				return;
			}

			sessionStorage.setItem("accessToken", auth.data.AccessToken);
			createApi(api.basePath, auth.data.AccessToken);

			if (rememberMe === true) {
				await saveUser(auth.data.User.Name, auth.data.AccessToken);
			}

			setQuickConnectLoading(-1);
			enqueueSnackbar(`Logged in as ${auth.data.User.Name}!`, {
				variant: "success",
			});
			navigate("/home");
		}, 1000);

		setLoading(false);
	};

	useLayoutEffect(() => {
		setBackdrop("", "");
	}, []);

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
						<LoadingButton
							onClick={handleQuickConnect}
							variant="contained"
							className="userEventButton"
							sx={{ width: "100%" }}
							loading={quickConnectLoading === 1}
							size="large"
						>
							Quick Connect
						</LoadingButton>
						<Button
							variant="contained"
							className="userEventButton"
							onClick={handleManualLogin}
							size="small"
						>
							Manual Login
						</Button>
					</div>

					<Dialog open={Boolean(quickConnectCode)} fullWidth maxWidth="xs">
						<DialogContent
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
							}}
						>
							<Typography
								variant="h5"
								mb={2}
								style={{
									width: "100%",
								}}
							>
								Quick Connect Code:
							</Typography>
							<DialogContentText>
								Use this code in the Quick Connect tab in your server to login.
							</DialogContentText>
							<div
								className="flex flex-row"
								style={{ gap: "1em", alignItems: "center", marginTop: "1em" }}
							>
								<Tooltip title="Click to copy" arrow placement="top">
									<Typography
										variant="h3"
										color="textPrimary"
										textAlign="center"
										sx={{
											background: "rgb(255 255 255 / 0.1)",
											width: "fit-content",
											padding: "0.4em",
											borderRadius: "10px",
											cursor: "pointer",
										}}
										onClick={(e) => {
											navigator.clipboard.writeText(quickConnectCode);
											enqueueSnackbar("Quick Connect Code copied!", {
												variant: "info",
												key: "copiedText",
											});
										}}
									>
										{quickConnectCode}
									</Typography>
								</Tooltip>
							</div>
						</DialogContent>
						<DialogActions
							className="flex flex-row"
							sx={{
								padding: "0em 1em 1em 1em",
								justifyContent: "space-between",
							}}
						>
							<FormControlLabel
								control={
									<Checkbox
										checked={rememberMe}
										onChange={handleCheckRememberMe}
									/>
								}
								label="Remember device"
							/>
							<Button
								variant="contained"
								onClick={() => {
									setQuickConnectCode("");
									setQuickConnectLoading(-1);
								}}
							>
								Close
							</Button>
						</DialogActions>
					</Dialog>
				</Container>
			</>
		);
	}
	if (users.isError) {
		return <ErrorNotice />;
	}
}
