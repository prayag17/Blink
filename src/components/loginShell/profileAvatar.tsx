import type { Api } from "@jellyfin/sdk";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { queryOptions } from "@tanstack/react-query";
import React, { useState } from "react";
import { useApiInContext } from "@/utils/store/api";

/** Public (listed) users of the current server; shared by the login pages. */
export const getPublicUsersQueryOptions = (api: Api | null | undefined) =>
	queryOptions({
		queryKey: ["login", "public-users"],
		queryFn: async () =>
			api ? (await getUserApi(api).getPublicUsers()).data : [],
		enabled: Boolean(api),
	});

type ProfileAvatarProps = {
	userId: string;
	name: string;
	imageTag?: string | null;
	/** Shows a lock badge for password-protected profiles. */
	locked?: boolean;
};

/** Round profile picture, falling back to the user's initial. */
export const ProfileAvatar = ({
	userId,
	name,
	imageTag,
	locked,
}: ProfileAvatarProps) => {
	const api = useApiInContext((s) => s.api);
	const [failed, setFailed] = useState(false);
	const showImage = api && imageTag && !failed;

	return (
		<span className="profile-avatar">
			{showImage ? (
				<img
					alt=""
					src={`${api.basePath}/Users/${userId}/Images/Primary?quality=85&fillWidth=224&fillHeight=224&tag=${imageTag}`}
					onError={() => setFailed(true)}
				/>
			) : (
				<span className="profile-avatar-fallback" aria-hidden>
					{name.trim().charAt(0).toUpperCase() || "?"}
				</span>
			)}
			{locked && (
				<span className="profile-lock" title="Password protected">
					<span className="material-symbols-rounded">lock</span>
				</span>
			)}
		</span>
	);
};

export const isPasswordProtected = (user: UserDto | undefined) =>
	user?.HasPassword !== false;
