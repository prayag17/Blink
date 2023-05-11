/** @format */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

	const checkServer = useQuery({
		queryKey: ["setup", "server"],
		queryFn: async () => {
			let serverUrl = serverIp.replace(/\/$/, "").trim();
			const candidates =
				await sdk.discovery.getRecommendedServerCandidates(
					serverUrl,
				);
			const best = sdk.discovery.findBestServer(candidates);
			if (best) {
				const issues = candidates.flatMap((s) => s.issues);
				if (
					issues.some(
						(i) =>
							i instanceof VersionOutdatedIssue ||
							i instanceof VersionUnsupportedIssue,
					)
				) {
					enqueueSnackbar(
						"Please Update your server to latest Jellyfin version to use this client",
					);
				}
				try {
					const api = sdk.createApi(best.address);
					const { data } = await getSystemApi(
						api,
					).getPublicSystemInfo();
					delete data.LocalAddress;
					const serv = {
						...data,
						PublicAddress: best.address,
						isDefault: false,
					};
					if (serv.StartupWizardCompleted) {
						event.emit("create-jellyfin-api", serverIp);
						data.Ip = serverIp;
						setServer(data);
						const users = await getUserApi(
							window.api,
						).getPublicUsers();
						if (users.data.length >= 1) {
							navigate("/login/users");

							return true;
						} else {
							navigate("/login/manual");
							return false;
						}
					} else {
						enqueueSnackbar(
							"Server setup not complete. Please complete your server setup.",
						);
					}
				} catch (error) {
					enqueueSnackbar("Something went wrong", {
						variant: "error",
					});
					console.error(error);
				}
			} else {
				enqueueSnackbar(
					"Server not found. Please check you entered address",
					{ variant: "error" },
				);
			}
			return "";
		},
		enabled: false,
		refetchOnWindowFocus: false,
	});

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
							loading={checkServer.isFetching}
							endIcon={
								<SvgIcon>
									<path d={mdiChevronRight}></path>
								</SvgIcon>
							}
							loadingPosition="end"
							onClick={() => checkServer.refetch()}
						>
							Add Server
						</LoadingButton>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
