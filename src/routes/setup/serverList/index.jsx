/** @format */
import React, { useState } from "react";

import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import { red } from "@mui/material/colors";

import "./serverList.module.scss";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	delServer,
	getAllServer,
	getDefaultServer,
	getServer,
	setDefaultServer,
} from "../../../utils/storage/servers";
import { AppBarBackOnly } from "../../../components/appBar/backOnly";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { createApi } from "../../../utils/store/api";
import { delUser } from "../../../utils/storage/user";

import { relaunch } from "@tauri-apps/api/process";

const ServerList = () => {
	const navigate = useNavigate();
	const [serverState, setServerState] = useState(null);
	const { enqueueSnackbar } = useSnackbar();
	const servers = useQuery({
		queryKey: ["servers-list"],
		queryFn: async () => await getAllServer(),
	});
	const defaultServer = useQuery({
		queryKey: ["default-server"],
		queryFn: async () => await getDefaultServer(),
	});
	const handleServerChange = useMutation({
		mutationFn: () => {
			setDefaultServer(serverState);
			delUser();
		},
		onSuccess: async () => {
			await relaunch();
		},
		onError: (error) => {
			console.error(error);
			enqueueSnackbar("Error changing the server", {
				variant: "error",
			});
		},
	});

	const handleDelete = (serverId) => {
		let tempList = servers.data.filter(
			(item) => item[0] != defaultServer.data && item[0] != serverId,
		);
		delServer(serverId).then(() => {
			// console.log(serverId);
			if (serverId == defaultServer.data) {
				if (tempList.length > 0) {
					setDefaultServer(tempList[0][0]);
				} else {
					navigate("/setup/server");
				}
			}
			servers.refetch();
			defaultServer.refetch();
		});
	};

	return (
		<div className="server-list">
			<AppBarBackOnly />
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					width: "40vw",
					alignItems: "center",
					marginBottom: "2em",
				}}
			>
				<Typography variant="h3" fontWeight={200}>
					Servers
				</Typography>
				<IconButton
					style={{
						fontSize: "1.64em",
					}}
					onClick={() => navigate("/setup/server")}
				>
					<div className="material-symbols-rounded">add</div>
				</IconButton>
			</div>
			<Paper className="server-list-container">
				{servers.isSuccess &&
					servers.data.map((server, index) => (
						<div key={index} className="server-list-item">
							<div className="material-symbols-rounded server-list-item-icon">
								dns
							</div>
							<div className="server-list-item-info">
								<Typography
									variant="h6"
									fontWeight={400}
									sx={{
										display: "flex",
										alignItems: "center",
									}}
								>
									{server[1].systemInfo.ServerName}
									{server[0] ==
										defaultServer.data && (
										<Chip
											label={
												<Typography
													variant="caption"
													fontWeight={
														600
													}
													fontFamily="JetBrains Mono Variable"
												>
													Current
												</Typography>
											}
											color="info"
											sx={{
												ml: 2,
												width: "5.4em",
											}}
											size="medium"
										/>
									)}
								</Typography>
								<Typography
									variant="subtitle1"
									style={{
										opacity: 0.7,
									}}
									fontWeight={300}
								>
									{server[1].address}
								</Typography>
								<Typography
									variant="subtitle2"
									style={{
										opacity: 0.5,
									}}
									fontWeight={300}
								>
									Version:{" "}
									{server[1].systemInfo.Version}
								</Typography>
							</div>
							<div className="server-list-item-buttons">
								<IconButton
									style={{
										fontSize: "1.64em",
									}}
									onClick={() => {
										setServerState(server[0]);
										handleServerChange.mutate();
									}}
									disabled={
										handleServerChange.isPending
									}
								>
									<div className="material-symbols-rounded">
										start
									</div>
								</IconButton>
								<IconButton
									style={{
										fontSize: "1.64em",

										color: red[400],
									}}
									disabled={
										handleServerChange.isPending
									}
									onClick={() => {
										handleDelete(server[0]);
									}}
								>
									<div className="material-symbols-rounded">
										delete_forever
									</div>
								</IconButton>
							</div>
						</div>
					))}
			</Paper>
		</div>
	);
};
export default ServerList;
