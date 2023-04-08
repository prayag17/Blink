/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiHeart } from "@mdi/js";

export const MdiHeart = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiHeart}></path>
		</SvgIcon>
	);
};
