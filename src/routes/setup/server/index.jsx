/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { EventEmitter as event } from "../../../eventEmitter.js";
import { setServer } from "../../../utils/storage/servers.js";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

// MUI
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import LoadingButton from "@mui/lab/LoadingButton";
import SvgIcon from "@mui/material/SvgIcon";
import Container from "@mui/material/Container";

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
import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "../../../App.jsx";
import axios from "axios";

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

	const ServerList = (props) => {
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

export const ServerSetup = (props) => {
	const sdk = new Jellyfin({
		clientInfo: {
			name: "JellyPlayer",
			version: appVer,
		},
		deviceInfo: {
			name: "JellyPlayer",
			id: uuidv4(),
		},
	});

	const [serverIp, setServerIp] = useState("");
	const [checkingServer, setServerCheckState] = useState(false);

	const { enqueueSnackbar } = useSnackbar();

	const navigate = useNavigate();

	const [loading, setLoading] = useState(false);

	const usersAvailable = async () => {};
	const addServer = async () => {
		event.emit("create-jellyfin-api", serverIp);
		let sysInfo = await getSystemApi(window.api).getPublicSystemInfo();
		sysInfo = sysInfo.data;

		// Set Server Config to Tauri store
		sysInfo.Ip = serverIp;
		setServer(sysInfo);
	};
	const checkServer = async () => {
		setServerCheckState(true);
		try {
			const result = await axiosClient.get(`${serverIp}/System/Ping`);
			if (result.data == "Jellyfin Server") {
				event.emit("create-jellyfin-api", serverIp);
				let sysInfo = await getSystemApi(
					window.api,
				).getPublicSystemInfo();
				sysInfo = sysInfo.data;
				sysInfo.Ip = serverIp;
				setServer(sysInfo);
				const users = await getUserApi(window.api).getPublicUsers();
				if (users.data.length >= 1) {
					navigate("/login/users");
				} else {
					navigate("/login/manual");
				}
			} else {
				enqueueSnackbar(
					"The provided ip address doesn't seem point to a Jellyfin server.",
					{ variant: "error" },
				);
			}
		} catch (error) {
			console.log(error);
			enqueueSnackbar("Unable to verfiy server address.", {
				variant: "error",
			});
		}

		setServerCheckState(false);
		return "";
	};

	const handleAddServer = () => {
		// setLoading(true);
		// let data;
		// fetch(`${serverIp}/System/Ping`, {
		// 	body: JSON.stringify(data),
		// })
		// 	.then((res) => res.json())
		// 	.then((data) => {
		// 		if (data == "Jellyfin Server") {
		// 			addServer();
		// 			setLoading(false);
		// 			return true;
		// 		} else {
		// 			enqueueSnackbar(
		// 				"The server address does not seem be a jellyfin server",
		// 				{ variant: "error" },
		// 			);
		// 			setLoading(false);
		// 			return false;
		// 		}
		// 	})
		// 	.catch((error) => {
		// 		setLoading(false);
		// 		enqueueSnackbar(
		// 			"Unable to verify whether the give address is a valid Jellyfin server",
		// 			{ variant: "error" },
		// 		);
		// 		console.error(error);
		// 	});
	};

	return (
		<>
			<Container maxWidth="sm" className={"centered serverContainer"}>
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
							helperText="Add your server adddress with https:// or http://. Eg: https://demo.jellyfin.org"
						></TextField>
					</Grid>
					<Grid item xl={5} md={6} sx={{ width: "100%" }}>
						<LoadingButton
							variant="contained"
							sx={{ width: "100%" }}
							size="large"
							loading={checkingServer}
							endIcon={
								<SvgIcon>
									<path d={mdiChevronRight}></path>
								</SvgIcon>
							}
							loadingPosition="end"
							onClick={() => checkServer()}
						>
							Add Server
						</LoadingButton>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
