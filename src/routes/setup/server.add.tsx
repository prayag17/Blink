import LoadingButton from "@mui/lab/LoadingButton";
import { yellow } from "@mui/material/colors";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation } from "@tanstack/react-query";

import { useSnackbar } from "notistack";
import React, { type FormEvent, useState } from "react";
import { setDefaultServer, setServer } from "@/utils/storage/servers";
import { jellyfin, useApiInContext } from "@/utils/store/api";
// SCSS
import "./server.scss";
import { Paper, Stack } from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import logo from "../../assets/logoBlackTransparent.png";

export const Route = createFileRoute("/setup/server/add")({
	component: ServerSetup,
});

function ServerSetup() {
	const [serverIp, setServerIp] = useState("");
	const createApi = useApiInContext((s) => s.createApi);

	const { enqueueSnackbar } = useSnackbar();

	const navigate = useNavigate();

	const checkServer = useMutation({
		mutationFn: async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const servers =
				await jellyfin.discovery.getRecommendedServerCandidates(serverIp);
			const bestServer = jellyfin.discovery.findBestServer(servers);
			return bestServer;
		},
		onSuccess: (bestServer) => {
			if (bestServer?.systemInfo?.Id) {
				createApi(bestServer.address, undefined);

				setDefaultServer(bestServer.systemInfo?.Id);
				setServer(bestServer.systemInfo?.Id, bestServer);

				enqueueSnackbar("Client added successfully", {
					variant: "success",
				});

				navigate({ to: "/login", replace: true });
			}
		},
		onError: (err) => {
			console.error(err);
			enqueueSnackbar(`${JSON.stringify(err)}`, { variant: "error" });
			enqueueSnackbar("Something went wrong", { variant: "error" });
		},
		onSettled: (bestServer) => {
			console.log(bestServer);
			if (!bestServer) {
				enqueueSnackbar("Provided server address is not a Jellyfin server.", {
					variant: "error",
				});
			}
		},
	});

	return (
		<div className="centered serverContainer flex flex-column flex-center">
			<Paper
				sx={{
					p: 4,
					width: "100%",
					maxWidth: "40em",
					backgroundColor: "rgba(20, 20, 30, 0.7)",
					backdropFilter: "blur(24px) saturate(180%)",
					backgroundImage:
						"linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
					borderRadius: 4,
					overflow: "hidden",
				}}
			>
				<Stack spacing={2} width="30em" alignItems="center">
					<img
						src={logo}
						alt="Blink"
						style={{
							width: "200px",
							height: "auto",
							objectFit: "contain",
						}}
					/>

					<Typography
						variant="body1"
						color="text.secondary"
						textAlign="center"
						maxWidth="80%"
						sx={{ lineHeight: 1.5 }}
					>
						Enter your Jellyfin server address to get started
					</Typography>

					<form
						onSubmit={(e) => checkServer.mutate(e)}
						className="flex flex-column"
						style={{ gap: "1em", width: "100%" }}
					>
						<TextField
							className="textbox"
							placeholder="https://jellyfin.example.com"
							fullWidth
							variant="outlined"
							// inputRef={serverIp}
							onChange={(event) => {
								setServerIp(event.target.value);
							}}
							InputProps={{
								startAdornment: (
									<span
										className="material-symbols-rounded"
										style={{ opacity: 0.5, marginRight: "12px" }}
									>
										dns
									</span>
								),
							}}
						/>
						<LoadingButton
							variant="contained"
							sx={{ width: "100%", borderRadius: 2, height: 48 }}
							size="large"
							loading={checkServer.isPending}
							type="submit"
						>
							Connect
						</LoadingButton>
					</form>
				</Stack>
			</Paper>
			<Stack
				direction="row"
				spacing={1}
				alignItems="center"
				sx={{ mt: 3, opacity: 0.6 }}
			>
				<span
					className="material-symbols-rounded"
					style={{
						color: yellow[700],
					}}
				>
					info
				</span>
				<Typography variant="subtitle1">
					Example: https://demo.jellyfin.org/stable
				</Typography>
			</Stack>
		</div>
	);
}
