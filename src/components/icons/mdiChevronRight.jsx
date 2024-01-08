/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiChevronRight } from "@mdi/js";

export const MdiChevronRight = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiChevronRight} />
		</SvgIcon>
	);
};
