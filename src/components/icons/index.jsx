/** @format */

/** @format */
import SvgIcon from "@mui/material/SvgIcon";
import React from "react";

const Icon = (icon, extraProps) => {
	return (
		<SvgIcon {...extraProps}>
			<path d={icon} />
		</SvgIcon>
	);
};

export default Icon;
