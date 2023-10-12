/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { EventEmitter as event } from "../../../eventEmitter.js";
import { setDefaultServer, setServer } from "../../../utils/storage/servers.js";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

// MUI
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import LoadingButton from "@mui/lab/LoadingButton";
import SvgIcon from "@mui/material/SvgIcon";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";

import { mdiChevronRight } from "@mdi/js";

import { useSnackbar } from "notistack";

import {
	Jellyfin,
	VersionOutdatedIssue,
	VersionUnsupportedIssue,
} from "@jellyfin/sdk";
import { version as appVer } from "../../../../package.json";
import { v4 as uuidv4 } from "uuid";

// SCSS
import "./server.module.scss";
import { useMutation, useQuery } from "@tanstack/react-query";
import { axiosClient } from "../../../App.jsx";
import axios from "axios";
import { useApi } from "../../../utils/store/api.js";
import { RecommendedServerDiscovery } from "@jellyfin/sdk/lib/discovery/recommended-server-discovery.js";
import { MdiInformation } from "../../../components/icons/mdiInformation.jsx";
import { yellow } from "@mui/material/colors";

export const ServerList = () => {
	const [renderServerList, setRenderServerList] = useState(false);
	const [serverListRender, setServerListRender] = useState([]);

	const currentServer = cookies.get("currentServer");
	const serverList = cookies.get("servers");
	let currentServerIp = "";
	serverList.map((item, index) => {
		currentServerIp = item[currentServer];
		// console.log(item);
	});

	const createServerListRender = async () => {
		let serverListKeys = [];
		serverList.map((item, index) => {
			serverListKeys.push(Object.keys(item));
			// for (let item in servers) {
			// if (item != "currentServer") {
			// setServerList([...serverList, JSON.parse(servers[item])]);
			// serverList.push(JSON.parse(servers[item]));
			// }
			// }
		});
		return serverListKeys;
		// console.log(serverListRender);
		// localStorage.setItem("servers", serverList);
	};

	const ServerLists = (props) => {
		const startRender = props.startRender;
		if (startRender) {
			return serverList.map((item, index) => {
				let serverIndex = serverListRender[index];
				let itm = item[serverIndex];
				console.log(itm.serverAddress);
				console.log("serverIndex : ", serverIndex);

				return (
					<div
						key={index}
						className="server"
						style={{ color: "white" }}
					>
						{/* <Typography></Typography> */}
						hello {itm.serverAddress} This is WIP
					</div>
				);
			});
		} else if (!startRender) {
			return <h1>Hfjsi</h1>;
		}
	};
	// const serverList = createServerList();
	useEffect(() => {
		createServerListRender().then((serverListKeys) => {
			console.log("ServerListKeys : ", serverListKeys);
			setServerListRender(serverListKeys);
			setRenderServerList(true);
		});
		// console.log(serverList);
	}, []);
	return (
		<>
			<Container maxWidth="md" className="centered">
				<Typography color="textPrimary" variant="h3">
					Select Server:
				</Typography>
				<div className="serverList">
					<ServerList
						startRender={renderServerList}
					></ServerList>
					{/* 
					{serverList.map((item, index) => {
						// let serverIndex = serverListRender[index];
						// let itm = item[serverIndex];
						// console.log(itm.serverAddress);
						// console.log("serverIndex : ", serverIndex);
						return (
							// <></>
							<div key={index} className="server">
								hello{" "}
								{
									item[serverListRender[index]]
										.serverAddress
								}{" "}
							</div>
						);
					})} */}
				</div>
			</Container>
		</>
	);
};

export const ServerSetup = () => {
	/**
	 * @type {[import("@jellyfin/sdk").Api, function, Jellyfin]}
	 */
	const [api, createApi, jellyfin] = useApi((state) => [
		state.api,
		state.createApi,
		state.jellyfin,
	]);

	const [serverIp, setServerIp] = useState("");

	const { enqueueSnackbar } = useSnackbar();

	const navigate = useNavigate();

	const checkServer = useMutation({
		mutationFn: async () => {
			const servers =
				await jellyfin.discovery.getRecommendedServerCandidates(
					serverIp,
				);
			const bestServer = jellyfin.discovery.findBestServer(servers);
			return bestServer;
		},
		onSuccess: (bestServer) => {
			if (bestServer) {
				console.info(bestServer);
				createApi(bestServer.address, null);
				setDefaultServer(bestServer.systemInfo.Id);
				setServer(bestServer.systemInfo.Id, bestServer);
				enqueueSnackbar("Client added successfully", {
					variant: "success",
				});
				navigate("/login");
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
				enqueueSnackbar(
					`Provided server address is not a Jellyfin server.`,
					{
						variant: "error",
					},
				);
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
					opacity: checkServer.isLoading ? 1 : 0,
					transition: "opacity 350ms",
				}}
			/>
			<Container
				maxWidth="sm"
				className={"centered serverContainer"}
				style={{
					opacity: checkServer.isLoading ? "0.5" : "1",
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
						></TextField>
					</Grid>
					<Grid item xl={5} md={6} sx={{ width: "100%" }}>
						<LoadingButton
							variant="contained"
							sx={{ width: "100%" }}
							size="large"
							loading={checkServer.isLoading}
							endIcon={
								<SvgIcon>
									<path d={mdiChevronRight}></path>
								</SvgIcon>
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
						<MdiInformation
							sx={{
								color: yellow[700],
							}}
						/>
						<Typography variant="subtitle1">
							Example: https://demo.jellyfin.org/stable
						</Typography>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
