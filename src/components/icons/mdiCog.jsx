/** @format */

import { MdiChevronLeft } from "./mdiChevronLeft";
/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiCog } from "@mdi/js";

export const MdiCog = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiCog}></path>
		</SvgIcon>
	);
};
