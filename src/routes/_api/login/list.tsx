import Skeleton from "@mui/material/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import LoginShell from "@/components/loginShell";
import {
	getPublicUsersQueryOptions,
	isPasswordProtected,
	ProfileAvatar,
} from "@/components/loginShell/profileAvatar";
import { useApiInContext } from "@/utils/store/api";

export const Route = createFileRoute("/_api/login/list")({
	component: LoginPublicUsersList,
});

function LoginPublicUsersList() {
	const api = useApiInContext((s) => s.api);
	const users = useQuery(getPublicUsersQueryOptions(api));

	return (
		<LoginShell
			width="wide"
			title="Who's watching?"
			subtitle="Choose your profile to sign in"
		>
			<div className="profile-grid">
				{users.isPending &&
					[0, 1, 2].map((key) => (
						<div className="profile" key={key} aria-hidden>
							<Skeleton variant="circular" width={112} height={112} />
							<Skeleton variant="text" width={72} />
						</div>
					))}

				{users.data?.map((user) => (
					<Link
						key={user.Id}
						className="profile"
						to="/login/$userId/$userName"
						params={{ userId: user.Id ?? "", userName: user.Name ?? "" }}
						aria-label={`Sign in as ${user.Name}`}
					>
						<ProfileAvatar
							userId={user.Id ?? ""}
							name={user.Name ?? ""}
							imageTag={user.PrimaryImageTag}
							locked={isPasswordProtected(user)}
						/>
						<span className="profile-name">{user.Name}</span>
					</Link>
				))}

				{!users.isPending && (
					<Link
						className="profile"
						to="/login/manual"
						aria-label="Sign in with a username"
					>
						<span className="profile-avatar profile-avatar-add">
							<span className="material-symbols-rounded">person_add</span>
						</span>
						<span className="profile-name">Other user</span>
					</Link>
				)}
			</div>

			{users.isError && (
				<p className="login-shell-subtitle" style={{ textAlign: "center" }}>
					Couldn't load profiles from this server. Use "Other user" to sign in
					with your username.
				</p>
			)}
		</LoginShell>
	);
}
