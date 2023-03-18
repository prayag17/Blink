/** @format */
import PropTypes from "prop-types";

import SvgIcon from "@mui/material/SvgIcon";

import { mdiStarHalfFull } from "@mdi/js";

export const MdiStarHalfFull = ({ colorA }) => {
	return (
		<SvgIcon sx={{ color: colorA }}>
			<path d={mdiStarHalfFull}></path>
		</SvgIcon>
	);
};

MdiStarHalfFull.propType = {
	colorA: PropTypes.string,
};
