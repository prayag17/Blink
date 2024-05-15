import PropTypes from "prop-types";
import React from "react";

import Box from "@mui/material/Box";

import "./avatar.module.scss";
import { useRouteContext } from "@tanstack/react-router";

export const AvatarImage = ({ userId }) => {
	const api = useRouteContext({ from: "/_api" }).api;
	return (
		<Box className="avatar-image-container">
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
		</Box>
	);
};

AvatarImage.propType = {
	userId: PropTypes.string.isRequired,
	userImageTags: PropTypes.any,
};
