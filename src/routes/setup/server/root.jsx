/** @format */

import { useState, useEffect } from "react";
import { Cookies, useCookies } from "react-cookie";
import { Navigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { EventEmitter as event } from "../../../eventEmitter.js";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";

// MUI
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Container from "@mui/material/Container";
import { useSnackbar } from "notistack";

// Svgs
import { ReactComponent as JellyplayerLogo } from "../../../assets/logo.svg";

// SCSS
import "./server.module.scss";

export const ServerList = () => {
	const [renderServerList, setRenderServerList] = useState(false);
	const [serverListRender, setServerListRender] = useState([]);
	const cookies = new Cookies();

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
	const [serverIp, setServerIp] = useState("");
	const [checkingServer, setServerCheckState] = useState(false);
	const [isJfServer, setIsJfServerState] = useState(false);

	const { enqueueSnackbar } = useSnackbar();
	const [serverlistCookies, setServerList] = useCookies(["servers"]);
	const [currentServer, setCurrentServer] = useCookies(["currentServer"]);
	const cookies = new Cookies();

	const addServer = async () => {
		event.emit("create-jellyfin-api", serverIp);
		let sysInfo = await getSystemApi(window.api).getPublicSystemInfo();
		sysInfo = sysInfo.data;
		let initServerList = cookies.get("servers");
		if (initServerList == null) {
			initServerList = [];
		} else {
			initServerList = JSON.parse(initServerList);
		}
		let serverConf = {
			serverName: sysInfo.ServerName,
			id: sysInfo.Id,
			jellyfinVersion: sysInfo.Version,
			serverAddress: serverIp,
		};
		let jfId = sysInfo.Id;
		let server = {};
		server[sysInfo.Id] = serverConf;
		server = JSON.stringify([...initServerList, server]);
		setServerList("servers", server, { path: "/" });
		setCurrentServer("currentServer", sysInfo.Id, { path: "/" });
		setIsJfServerState(true);
	};

	const handleAddServer = () => {
		let data;
		setServerCheckState(true);
		fetch(`${serverIp}/System/Ping`, {
			body: JSON.stringify(data),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data == "Jellyfin Server") {
					console.log(true);
					setServerCheckState(false);
					addServer();
					return true;
				} else {
					setServerCheckState(false);
					enqueueSnackbar(
						"The server address does not seem be a jellyfin server",
						{ variant: "error" },
					);
					return false;
				}
			})
			.catch((error) => {
				setServerCheckState(false);
				enqueueSnackbar(
					"Unable to verify whether the give address is a valid Jellyfin server",
					{ variant: "error" },
				);
				console.error(error);
			});
	};

	return (
		<>
			{checkingServer && <LinearProgress />}
			{isJfServer && <Navigate to="/login" />}
			<Container
				maxWidth="md"
				className={
					checkingServer
						? "centered serverContainer loading"
						: "centered serverContainer"
				}
			>
				<Grid
					container
					spacing={2}
					direction="column"
					justifyContent="center"
					alignItems="center"
				>
					<Grid item xl={5} md={6} sx={{ marginBottom: "1em" }}>
						<JellyplayerLogo className="logo" />
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
							helperText="Add your server adddress with https:// or http://"
						></TextField>
					</Grid>
					<Grid item xl={5} md={6} sx={{ width: "100%" }}>
						<Button
							variant="contained"
							sx={{ width: "100%" }}
							size="large"
							onClick={handleAddServer}
						>
							Add Server
						</Button>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
