import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { setDefaultServer, setServer } from "../../../utils/storage/servers";

import LoadingButton from "@mui/lab/LoadingButton";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import SvgIcon from "@mui/material/SvgIcon";
// MUI
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useSnackbar } from "notistack";

import { yellow } from "@mui/material/colors";
import { useMutation } from "@tanstack/react-query";
import { createApi, useApi } from "../../../utils/store/api";
// SCSS
import "./server.module.scss";

export const ServerSetup = () => {
	const [jellyfin] = useApi((state) => [state.jellyfin]);

	const [serverIp, setServerIp] = useState("");

	const { enqueueSnackbar } = useSnackbar();

	const navigate = useNavigate();

	const checkServer = useMutation({
		mutationFn: async () => {
			const servers =
				await jellyfin.discovery.getRecommendedServerCandidates(serverIp);
			const bestServer = jellyfin.discovery.findBestServer(servers);
			return bestServer;
		},
		onSuccess: (bestServer) => {
			if (bestServer) {
				createApi(bestServer.address, undefined);

				setDefaultServer(bestServer.systemInfo.Id);
				setServer(bestServer.systemInfo.Id, bestServer);

				enqueueSnackbar("Client added successfully", {
					variant: "success",
				});

				navigate("/login/index");
			}
		},
		onError: (err) => {
			console.error(err);
			enqueueSnackbar(`${err}`, { variant: "error" });
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
		<>
			<LinearProgress
				sx={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					opacity: checkServer.isPending ? 1 : 0,
					transition: "opacity 350ms",
				}}
			/>
			<Container
				maxWidth="sm"
				className={"centered serverContainer"}
				style={{
					opacity: checkServer.isPending ? "0.5" : "1",
					transition: "opacity 350ms",
				}}
			>
				<Grid
					container
					spacing={2}
					direction="column"
					justifyContent="center"
					alignItems="center"
				>
					<Grid item xl={5} md={6} sx={{ marginBottom: "1em" }}>
						<Typography variant="h3">Add Server</Typography>
					</Grid>
					<Grid item xl={5} md={6} sx={{ width: "100%" }}>
						<TextField
							className="textbox"
							label="Server Address:"
							variant="outlined"
							// inputRef={serverIp}
							onChange={(event) => {
								setServerIp(event.target.value);
							}}
						/>
					</Grid>
					<Grid item xl={5} md={6} sx={{ width: "100%" }}>
						<LoadingButton
							variant="contained"
							sx={{ width: "100%" }}
							size="large"
							loading={checkServer.isPending}
							endIcon={
								<span className="material-symbols-rounded">chevron_right</span>
							}
							loadingPosition="end"
							onClick={checkServer.mutate}
						>
							Add Server
						</LoadingButton>
					</Grid>
					<Grid
						item
						xl={5}
						md={6}
						sx={{
							width: "100%",
							display: "flex",
							alignItems: "center",
							gap: 1,
							opacity: 0.6,
						}}
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
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
