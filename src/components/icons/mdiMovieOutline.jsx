/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiMovieOutline } from "@mdi/js";

export const MdiMovieOutline = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiMovieOutline} />
		</SvgIcon>
	);
};
