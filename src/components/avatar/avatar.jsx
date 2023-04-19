/** @format */
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";

import { MdiAccount } from "../icons/mdiAccount";

import "./avatar.module.scss";

export const AvatarImage = ({ userId, userImageTags }) => {
	return (
		<Box className="avatar-image-container">
			{!!userImageTags && (
				<div
					className="avatar-image"
					style={{
						backgroundImage:
							"url('" +
							window.api.basePath +
							"/Users/" +
							userId +
							"/Images/Primary')",
					}}
				></div>
			)}

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
