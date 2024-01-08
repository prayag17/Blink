/** @format */

/** @format */
import SvgIcon from "@mui/material/SvgIcon";
import { MdiChevronLeft } from "./mdiChevronLeft";

import { mdiAccount } from "@mdi/js";

export const MdiAccount = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiAccount} />
		</SvgIcon>
	);
};
