/** @format */
import React from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";

import { MdiAccount } from "../icons/mdiAccount";

import "./avatar.module.scss";

import { useApi } from "../../utils/store/api";

export const AvatarImage = ({ userId }) => {
	const [api] = useApi((state) => [state.api]);
	return (
		<Box className="avatar-image-container">
			<div
				className="avatar-image"
				style={{
					backgroundImage:
						"url('" +
						api.basePath +
						"/Users/" +
						userId +
						"/Images/Primary')",
				}}
			></div>

			<div className="avatar-image-icon-container">
				<MdiAccount className="avatar-image-icon" />
			</div>
		</Box>
	);
};

export const AvatarSideMenu = ({ userName }) => {
	return <div></div>;
};

AvatarImage.propType = {
	userId: PropTypes.string.isRequired,
	userImageTags: PropTypes.any,
};
