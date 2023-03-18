/** @format */
import PropTypes from "prop-types";

import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";

import { MdiAccount } from "../icons/mdiAccount";

import "./avatar.module.scss";

export const AvatarCard = ({ userName, userId, userImageAvailable }) => {
	return (
		<ButtonBase className="card square" sx={{ borderRadius: "10px" }}>
			<div className="card-image-container">
				{userImageAvailable ? (
					<div
						className="card-image"
						style={{
							backgroundImage:
								"url('" +
								window.api.basePath +
								"/Users/" +
								userId +
								"/Images/Primary')",
							// http://localhost/Users/{userId}/Images/{imageType}
						}}
					></div>
				) : (
					<div className="card-image empty"></div>
				)}
				<div className="card-image-icon-container">
					<MdiAccount className="card-image-icon" />
				</div>
			</div>
			<div className="card-text-container">
				<Typography
					variant="button"
					color="textPrimary"
					className="card-text"
				>
					{userName}
				</Typography>
			</div>
		</ButtonBase>
	);
};

export const AvatarImage = ({ userId }) => {
	return (
		<div className="avatar-image-container">
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

			<div className="avatar-image-icon-container">
				<MdiAccount className="avatar-image-icon" />
			</div>
		</div>
	);
};

export const AvatarSideMenu = ({ userName }) => {
	return <div></div>;
};

AvatarCard.propType = {
	userName: PropTypes.string.isRequired,
	userId: PropTypes.string.isRequired,
	userImageAvailable: PropTypes.bool.isRequired,
};

AvatarImage.propType = {
	userId: PropTypes.string.isRequired,
};
