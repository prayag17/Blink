import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useSnackbar } from "notistack";
import React, { useLayoutEffect, useState } from "react";
import AppBarBackOnly from "@/components/appBar/backOnly";
import {
	delServer,
	getAllServers,
	getDefaultServer,
	type ServerInfo,
	setDefaultServer,
} from "@/utils/storage/servers";
import { delUser } from "@/utils/storage/user";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./serverList.scss";
import { useShallow } from "zustand/shallow";
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

	const setBackdrop = useBackdropStore(
		useShallow((state) => state.setBackdrop),
	);

	useLayoutEffect(() => {
		setBackdrop("");
	}, []);

	const [addServerDialog, setAddServerDialog] = useState(false);

	return (
		<div className="server-list flex flex-column flex-center centered">
			<AppBarBackOnly />
			<Paper
				sx={{
					p: 4,
					width: "100%",
					maxWidth: "600px",
					backgroundColor: "rgba(20, 20, 30, 0.7)",
					backdropFilter: "blur(24px) saturate(180%)",
					backgroundImage:
						"linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
					borderRadius: 4,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					gap: 3,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography variant="h4" fontWeight="bold">
						Servers
					</Typography>
					<IconButton
						onClick={() => setAddServerDialog(true)}
						sx={{
							bgcolor: "rgba(255,255,255,0.05)",
							"&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
						}}
					>
						<span className="material-symbols-rounded">add</span>
					</IconButton>
				</div>

				<div className="flex flex-column" style={{ gap: "1em" }}>
					{servers.isSuccess &&
						servers.data.map((server) => (
							<div
								key={server.id}
								className="server-list-item"
								style={{
									display: "flex",
									alignItems: "center",
									padding: "16px",
									borderRadius: "16px",
									backgroundColor: "rgba(0,0,0,0.2)",
									border: "1px solid rgba(255,255,255,0.05)",
									gap: "16px",
								}}
							>
								<div
									className="material-symbols-rounded"
									style={{ fontSize: "24px", opacity: 0.7 }}
								>
									dns
								</div>
								<div style={{ flex: 1 }}>
									<Typography
										variant="h6"
										fontWeight={600}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										{server.systemInfo?.ServerName}
										{server.id === defaultServer.data && (
											<Chip
												label="Current"
												color="primary"
												size="small"
												sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
											/>
										)}
									</Typography>
									<Typography variant="body2" style={{ opacity: 0.7 }} noWrap>
										{server.address}
									</Typography>
								</div>
								<div style={{ display: "flex", gap: "8px" }}>
									<IconButton
										onClick={() => {
											handleServerChange.mutate(server);
										}}
										disabled={handleServerChange.isPending}
										size="small"
										sx={{
											bgcolor: "rgba(255,255,255,0.05)",
											"&:hover": { bgcolor: "var(--mui-palette-primary-main)" },
										}}
									>
										<span className="material-symbols-rounded">login</span>
									</IconButton>
									<IconButton
										onClick={() => handleDelete(server)}
										size="small"
										sx={{
											bgcolor: "rgba(255,255,255,0.05)",
											"&:hover": { bgcolor: "var(--mui-palette-error-main)" },
										}}
									>
										<span className="material-symbols-rounded">delete</span>
									</IconButton>
								</div>
							</div>
						))}
				</div>
			</Paper>
			<AddServerDialog
				open={addServerDialog}
				sideEffect={() => servers.refetch()}
				setAddServerDialog={setAddServerDialog}
			/>
		</div>
	);
}
export default ServerList;
