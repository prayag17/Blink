/** @format */

import { MdiChevronLeft } from "./mdiChevronLeft";
/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiAccount } from "@mdi/js";

export const MdiAccount = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiAccount}></path>
		</SvgIcon>
	);
};
