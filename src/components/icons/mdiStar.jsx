/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiStar } from "@mdi/js";

export const MdiStar = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiStar} />
		</SvgIcon>
	);
};
