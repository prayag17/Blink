/** @format */

import React from "react";
/** @format */
import SvgIcon from "@mui/material/SvgIcon";

const Icon = (icon, extraProps) => {
	return (
		<SvgIcon {...extraProps}>
			<path d={icon}></path>
		</SvgIcon>
	);
};

export default Icon;
