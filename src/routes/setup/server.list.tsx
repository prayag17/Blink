import React, { useLayoutEffect, useState } from "react";

import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { red } from "@mui/material/colors";

import AppBarBackOnly from "@/components/appBar/backOnly";
import {
	type ServerInfo,
	delServer,
	getAllServers,
	getDefaultServer,
	setDefaultServer,
} from "@/utils/storage/servers";
import { delUser } from "@/utils/storage/user";
import { useBackdropStore } from "@/utils/store/backdrop";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useSnackbar } from "notistack";
import "./serverList.scss";
import AddServerDialog from "@/components/addServerDialog";
import { useApiInContext } from "@/utils/store/api";

export const Route = createFileRoute("/setup/server/list")({
	component: ServerList,
});

function ServerList() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const router = useRouter();

	const createApi = useApiInContext((s) => s.createApi);

	const queryClient = useQueryClient();

	const servers = useQuery({
		queryKey: ["servers-list"],
		queryFn: async () => await getAllServers(),
	});

	const defaultServer = useQuery({
		queryKey: ["default-server"],
		queryFn: async () => await getDefaultServer(),
	});

	const handleServerChange = useMutation({
		mutationFn: async (server: ServerInfo) => {
			await delUser();
			await setDefaultServer(server.id);
			queryClient.clear();
			await defaultServer.refetch();
			createApi(server.address, undefined);
			queryClient.removeQueries();
		},
		onSuccess: async () => {
			navigate({ to: "/login" });
		},
		onError: (error) => {
			console.error(error);
			enqueueSnackbar("Error changing the server", {
				variant: "error",
			});
		},
	});

	const handleDelete = async (server: ServerInfo) => {
		await delServer(server.id);

		if (server.id === defaultServer.data) {
			await delUser();
			await servers.refetch();

			if ((servers.data?.length ?? 0) > 1) {
				if (servers.data?.[0].id) {
					setDefaultServer(servers.data?.[0].id);
					createApi(servers.data?.[0].address, undefined);
				}
			} else {
				await setDefaultServer(null);
				await router.invalidate();
			}
			queryClient.removeQueries();
			navigate({ to: "/" });
		}
		enqueueSnackbar("Server deleted successfully!", { variant: "success" });

		await servers.refetch();
		await defaultServer.refetch();
	};

	const setBackdrop = useBackdropStore((state) => state.setBackdrop);

	useLayoutEffect(() => {
		setBackdrop("", "");
	}, []);

	const [addServerDialog, setAddServerDialog] = useState(false);

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
					onClick={() => setAddServerDialog(true)}
				>
					<div className="material-symbols-rounded">add</div>
				</IconButton>
				<AddServerDialog
					open={addServerDialog}
					sideEffect={() => servers.refetch()}
					setAddServerDialog={setAddServerDialog}
				/>
			</div>
			<Paper className="server-list-container">
				{servers.isSuccess &&
					servers.data.map((server) => (
						<div key={server.id} className="server-list-item">
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
									{server.systemInfo?.ServerName}
									{server.id === defaultServer.data && (
										<Chip
											label={
												<Typography variant="caption" fontWeight={700}>
													Current
												</Typography>
											}
											color="info"
											sx={{
												ml: 2,
												width: "5.4em",
											}}
											size="small"
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
									{server.address}
								</Typography>
								<Typography
									variant="subtitle2"
									style={{
										opacity: 0.5,
									}}
									fontWeight={300}
								>
									Version: {server.systemInfo?.Version}
								</Typography>
							</div>
							<div className="server-list-item-buttons">
								<IconButton
									style={{
										fontSize: "1.64em",
									}}
									onClick={() => {
										handleServerChange.mutate(server);
									}}
									disabled={handleServerChange.isPending}
								>
									<div className="material-symbols-rounded">start</div>
								</IconButton>
								<IconButton
									style={{
										fontSize: "1.64em",

										color: red[400],
									}}
									disabled={handleServerChange.isPending}
									onClick={() => {
										handleDelete(server);
									}}
								>
									<div className="material-symbols-rounded">delete_forever</div>
								</IconButton>
							</div>
						</div>
					))}
			</Paper>
		</div>
	);
}
export default ServerList;
