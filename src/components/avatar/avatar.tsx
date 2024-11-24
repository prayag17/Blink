import React from "react";

import "./avatar.module.scss";
import { useApiInContext } from "@/utils/store/api";

export const AvatarImage = ({ userId }: { userId: string }) => {
	const api = useApiInContext((s) => s.api);
	if (!api) return null;

	return (
		<div className="avatar-image-container">
			<div
				className="avatar-image"
				style={{
					backgroundImage: `url('${api.basePath}/Users/${userId}/Images/Primary')`,
				}}
			/>

			<div className="avatar-image-icon-container">
				<span className="material-symbols-rounded avatar-image-icon">
					account_circle
				</span>
			</div>
		</div>
	);
};