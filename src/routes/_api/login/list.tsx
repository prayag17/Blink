import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";

import { Chip, Typography } from "@mui/material";


import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice.jsx";
import "./login.scss";

import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop.js";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client";
import { Link, createFileRoute } from "@tanstack/react-router";

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
		>
			<div className="user-card-image-container">
				{user.PrimaryImageTag ? (
					<img
						className="user-card-image"
						alt={"user"}
						src={`${api?.basePath}/Users/${user.Id}/Images/Primary?quality=80&tag=${user.PrimaryImageTag}`}
					/>
				) : (
					<img className="user-card-image" alt="user" src={avatar} />
				)}
			</div>
			<Typography mt={1} align="center">
				{user.Name}
			</Typography>
		</Link>
	);
}

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
		setBackdrop("", "");
	}, []);

	if (users.isSuccess) {
		return (
			<div className="login-container scrollY">
				<Typography variant="h4" align="center">
					Users
				</Typography>

				<div className="user-list-container roundedScrollbar">
					{users.data.map((item) => {
						return <UserCard user={item} key={item.Id} />;
					})}
				</div>

				<Chip
					style={{ marginLeft: "50%", transform: "translateX(-50%)" }}
					label={
						<Typography variant="body2" align="center">
							Don't see your user? Try using{" "}
							<Link to="/login/manual">Manual Login</Link> or{" "}
							<Link to="/setup/server/list">Changing Server</Link>
						</Typography>
					}
				/>
			</div>
		);
	}
	if (users.isError) {
		return <ErrorNotice />;
	}
}
