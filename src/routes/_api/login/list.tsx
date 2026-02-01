import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { Box, Chip, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";

import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice.jsx";
import "./login.scss";

import type { UserDto } from "@jellyfin/sdk/lib/generated-client";
import { Paper } from "@mui/material";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop.js";
import avatar from "../../../assets/icons/avatar.png";

export const Route = createFileRoute("/_api/login/list")({
	component: LoginPublicUsersList,
});

const UserCard = ({ user }: { user: UserDto }) => {
	const api = useApiInContext((s) => s.api);
	return (
		<Link
			to="/login/$userId/$userName"
			params={{ userId: user.Id ?? "", userName: user.Name ?? "" }}
			className="user-list-item user-card"
			style={{ textDecoration: "none", display: "block" }}
		>
			<Paper
				elevation={0}
				sx={{
					p: 2,
					bgcolor: "rgba(255,255,255,0.03)",
					"&:hover": {
						bgcolor: "rgba(255,255,255,0.1)",
						transform: "translateY(-4px)",
						boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
					},
					transition: "all 0.3s ease",
					borderRadius: 4,
					border: "1px solid rgba(255,255,255,0.05)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					width: "160px",
					height: "100%",
					cursor: "pointer",
				}}
			>
				<div
					className="user-card-image-container"
					style={{
						width: "100px",
						height: "100px",
						borderRadius: "50%",
						overflow: "hidden",
						boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
					}}
				>
					{user.PrimaryImageTag ? (
						<img
							className="user-card-image"
							alt={"user"}
							src={`${api?.basePath}/Users/${user.Id}/Images/Primary?quality=80&tag=${user.PrimaryImageTag}`}
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					) : (
						<img
							className="user-card-image"
							alt="user"
							src={avatar}
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					)}
				</div>
				<Typography
					mt={2}
					align="center"
					variant="subtitle1"
					fontWeight="bold"
					noWrap
					sx={{ width: "100%", color: "text.primary" }}
				>
					{user.Name}
				</Typography>
			</Paper>
		</Link>
	);
};

function LoginPublicUsersList() {
	const api = useApiInContext((s) => s.api);

	const users = useQuery({
		queryKey: ["login", "public-users"],
		queryFn: async () => {
			if (!api) return [];
			const result = await getUserApi(api).getPublicUsers();
			return result.data;
		},
		enabled: Boolean(api),
	});

	const setBackdrop = useBackdropStore((state) => state.setBackdrop);
	useEffect(() => {
		setBackdrop("");
	}, []);

	if (users.isSuccess) {
		return (
			<div className="login-container scrollY flex flex-column flex-center">
				<Paper
					sx={{
						p: 4,
						maxWidth: "800px",
						width: "90%",
						backgroundColor: "rgba(20, 20, 30, 0.7)",
						backdropFilter: "blur(24px) saturate(180%)",
						backgroundImage:
							"linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
						border: "1px solid rgba(255, 255, 255, 0.08)",
						boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
						borderRadius: 4,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 3,
					}}
				>
					<Typography variant="h4" align="center" fontWeight="bold">
						Select User
					</Typography>

					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 3,
							justifyContent: "center",
							width: "100%",
							maxHeight: "60vh",
							overflowY: "auto",
							py: 2,
							"&::-webkit-scrollbar": { display: "none" },
							scrollbarWidth: "none",
						}}
					>
						{users.data.map((item) => {
							return <UserCard user={item} key={item.Id} />;
						})}
					</Box>

					<Chip
						label={
							<Typography variant="body2" align="center">
								Don't see your user? Try using{" "}
								<Link
									to="/login/manual"
									style={{ color: "inherit", fontWeight: "bold" }}
								>
									Manual Login
								</Link>{" "}
								or{" "}
								<Link
									to="/setup/server/list"
									style={{ color: "inherit", fontWeight: "bold" }}
								>
									Changing Server
								</Link>
							</Typography>
						}
						sx={{
							bgcolor: "rgba(255,255,255,0.05)",
							p: 1,
							height: "auto",
							"& .MuiChip-label": {
								padding: "8px 12px",
							},
						}}
					/>
				</Paper>
			</div>
		);
	}
	if (users.isError) {
		return <ErrorNotice />;
	}
}
