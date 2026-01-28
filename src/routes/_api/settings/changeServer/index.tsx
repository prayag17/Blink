import {
	alpha,
	Button,
	Card,
	CardActions,
	CardContent,
	Chip,
	Grid,
	IconButton,
	Typography,
	useTheme,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useSnackbar } from "notistack";
import React, { useState } from "react";
import AddServerDialog from "@/components/addServerDialog";
import CircularPageLoadingAnimation from "@/components/circularPageLoadingAnimation";
import {
	delServer,
	getAllServers,
	getDefaultServer,
	setDefaultServer,
} from "@/utils/storage/servers";
import { delUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";

export const Route = createFileRoute("/_api/settings/changeServer/")({
	component: ChangeServerRoute,
});

function ChangeServerRoute() {
	const _theme = useTheme();
	const queryClient = useQueryClient();
	const createApi = useApiInContext((s) => s.createApi);
	const { enqueueSnackbar } = useSnackbar();
	const [addServerDialogOpen, setAddServerDialogOpen] = useState(false);

	const serversQuery = useQuery({
		queryKey: ["servers"],
		queryFn: async () => {
			return await getAllServers();
		},
	});

	const activeServerQuery = useQuery({
		queryKey: ["activeServer"],
		queryFn: async () => {
			return await getDefaultServer();
		},
	});

	const handleConnect = async (serverId: string) => {
		try {
			// Clear current user when switching servers to force login/user fetch
			await delUser();
			await setDefaultServer(serverId);

			const servers = await getAllServers();
			const server = servers.find((s) => s.id === serverId);

			if (server) {
				createApi(server.address);
			}

			// Reload the page to reset API context and states
			window.location.href = "/";
		} catch (error) {
			console.error("Failed to switch server", error);
			enqueueSnackbar("Failed to switch server", { variant: "error" });
		}
	};

	const handleDelete = async (serverId: string) => {
		try {
			await delServer(serverId);
			queryClient.invalidateQueries({ queryKey: ["servers"] });
			enqueueSnackbar("Server removed", { variant: "success" });
		} catch (error) {
			console.error("Failed to delete server", error);
			enqueueSnackbar("Failed to delete server", { variant: "error" });
		}
	};

	if (serversQuery.isLoading || activeServerQuery.isLoading) {
		return <CircularPageLoadingAnimation />;
	}

	return (
		<div className="settings-page-scrollY">
			<div
				style={{
					marginBottom: "2em",
				}}
			>
				<Typography variant="h4">Servers</Typography>
			</div>

			<Grid container spacing={3}>
				{serversQuery.data?.map((server) => {
					const isActive = activeServerQuery.data === server.id;
					const spalshUrl =
						new URL(server.address).pathname.length > 1
							? `${new URL(server.address).origin}${`${new URL(server.address).pathname}/`}Branding/Splashscreen?fillWidth=400&fillHeight=100`
							: `${server.address}Branding/Splashscreen?fillWidth=400&fillHeight=100`;

					return (
						<Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }} key={server.id}>
							<Card
								elevation={0}
								sx={{
									height: "100%",
									minHeight: "280px",
									display: "flex",
									flexDirection: "column",
									position: "relative",
									overflow: "hidden",
									borderRadius: "24px",
									transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
									border: "1px solid rgba(255, 255, 255, 0.08)",
									background: "rgba(30, 30, 35, 0.4)",
									boxShadow: "none",
									backdropFilter: "blur(12px)",
									"&:hover": {
										transform: "translateY(-4px)",
										boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
										borderColor: "rgba(255, 255, 255, 0.2)",
										"& .server-card-bg": {
											transform: "scale(1.05)",
										},
									},
								}}
							>
								{/* Standard BG Section / Cover Area */}
								<div
									className="server-card-bg"
									style={{
										height: "100px",
										width: "100%",
										background: "linear-gradient(45deg, #2a2a35, #1a1a20)",
										position: "absolute",
										top: 0,
										left: 0,
										zIndex: 0,
										transition: "transform 0.4s ease",
									}}
								>
									<img
										alt={server.systemInfo?.ServerName || "Unknown Server"}
										src={spalshUrl}
										style={{
											height: "100%",
											width: "100%",
											objectFit: "cover",
										}}
									/>
								</div>

								{isActive && (
									<Chip
										label="Active"
										size="small"
										color="primary"
										sx={{
											fontWeight: "bold",
											position: "absolute",
											top: 24,
											right: 24,
											zIndex: 2,
										}}
									/>
								)}

								<CardContent
									sx={{
										flexGrow: 1,
										zIndex: 1,
										pt: "60px !important", // Push content down to overlap properly
										px: 3,
									}}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-end",
											marginBottom: "1.5rem",
										}}
									>
										<div
											style={{
												width: "64px",
												height: "64px",
												borderRadius: "20px",
												background: "rgba(30, 30, 40, 0.8)",
												backdropFilter: "blur(4px)",
												border: "1px solid rgba(255,255,255,0.1)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
											}}
										>
											<span
												className="material-symbols-rounded"
												style={{
													fontSize: "32px",
													color: "#fff",
													opacity: isActive ? 1 : 0.8,
												}}
											>
												dns
											</span>
										</div>
									</div>

									<Typography
										variant="h5"
										component="div"
										fontWeight="bold"
										noWrap
										title={server.systemInfo?.ServerName || "Unknown Server"}
										sx={{ mb: 0.5, letterSpacing: "-0.02em" }}
									>
										{server.systemInfo?.ServerName || "Unknown Server"}
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										noWrap
										title={server.address}
										sx={{
											opacity: 0.6,
											fontFamily: "monospace",
											fontSize: "0.85rem",
										}}
									>
										{server.address}
									</Typography>
								</CardContent>

								<CardActions
									sx={{
										justifyContent: "space-between",
										padding: "24px",
										zIndex: 1,
										mt: "auto",
									}}
								>
									<Button
										variant="outlined"
										color="error"
										size="small"
										onClick={() => handleDelete(server.id)}
										sx={{
											minWidth: "40px",
											width: "40px",
											height: "40px",
											borderRadius: "12px",
											p: 0,
											border: "1px solid rgba(211, 47, 47, 0.3)",
											"&:hover": {
												backgroundColor: "rgba(211, 47, 47, 0.1)",
												border: "1px solid rgba(211, 47, 47, 0.8)",
											},
										}}
									>
										<span className="material-symbols-rounded">delete</span>
									</Button>

									{!isActive ? (
										<Button
											variant="contained"
											onClick={() => handleConnect(server.id)}
											sx={{
												borderRadius: "12px",
												textTransform: "none",
												fontWeight: 600,
												px: 3,
											}}
										>
											Connect
										</Button>
									) : (
										<Button
											disabled
											startIcon={
												<span className="material-symbols-rounded">check</span>
											}
											sx={{
												borderRadius: "12px",
												textTransform: "none",
												fontWeight: 600,
												color: "text.primary",
												"&.Mui-disabled": {
													color: "text.primary",
													opacity: 0.7,
												},
											}}
										>
											Connected
										</Button>
									)}
								</CardActions>
							</Card>
						</Grid>
					);
				})}

				{/* Add Server Card */}
				<Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
					<Card
						onClick={() => setAddServerDialogOpen(true)}
						elevation={0}
						sx={{
							height: "100%",
							minHeight: "280px",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							position: "relative",
							borderRadius: "24px",
							cursor: "pointer",
							background: "rgba(255, 255, 255, 0.02)",
							border: "2px dashed rgba(255, 255, 255, 0.1)",
							transition: "all 0.2s ease-in-out",
							"&:hover": {
								background: "rgba(255, 255, 255, 0.05)",
								borderColor: "rgba(255, 255, 255, 0.3)",
								transform: "translateY(-4px)",
								"& .add-icon": {
									transform: "scale(1.1) rotate(90deg)",
									color: "var(--mui-palette-primary-main)",
								},
							},
						}}
					>
						<div
							className="add-icon"
							style={{
								width: "80px",
								height: "80px",
								borderRadius: "50%",
								backgroundColor: "rgba(255, 255, 255, 0.05)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								marginBottom: "1.5rem",
								transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
							}}
						>
							<span
								className="material-symbols-rounded"
								style={{ fontSize: "40px", opacity: 0.7 }}
							>
								add
							</span>
						</div>
						<Typography variant="h6" fontWeight="bold">
							Add Server
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							Connect to a new Jellyfin server
						</Typography>
					</Card>
				</Grid>
			</Grid>

			<AddServerDialog
				open={addServerDialogOpen}
				setAddServerDialog={setAddServerDialogOpen}
				sideEffect={async () => {
					await queryClient.invalidateQueries({ queryKey: ["servers"] });
				}}
			/>
		</div>
	);
}
