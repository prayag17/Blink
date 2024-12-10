import React, { type FormEvent, useState } from "react";

import { setDefaultServer, setServer } from "@/utils/storage/servers";

import LoadingButton from "@mui/lab/LoadingButton";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useSnackbar } from "notistack";

import { jellyfin, useApiInContext } from "@/utils/store/api";
import { yellow } from "@mui/material/colors";
import { useMutation } from "@tanstack/react-query";
// SCSS
import "./server.scss";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

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
		<div
			className={"centered serverContainer flex flex-column flex-center"}
			style={{
				opacity: checkServer.isPending ? "0.5" : "1",
				transition: "opacity 350ms",
				width: "40vw",
			}}
		>
			<div style={{ marginBottom: "1em" }}>
				<Typography variant="h3">Add Server</Typography>
			</div>
			<form
				onSubmit={(e) => checkServer.mutate(e)}
				className="flex flex-column"
				style={{ gap: "1em", width: "100%" }}
			>
				<TextField
					className="textbox"
					label="Server Address:"
					variant="outlined"
					// inputRef={serverIp}
					onChange={(event) => {
						setServerIp(event.target.value);
					}}
				/>
				<LoadingButton
					variant="contained"
					sx={{ width: "100%" }}
					size="large"
					loading={checkServer.isPending}
					endIcon={
						<span className="material-symbols-rounded">chevron_right</span>
					}
					loadingPosition="end"
					type="submit"
				>
					Add Server
				</LoadingButton>
			</form>
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
		</div>
	);
}
