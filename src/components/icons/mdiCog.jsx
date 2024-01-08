/** @format */

/** @format */
import SvgIcon from "@mui/material/SvgIcon";
import { MdiChevronLeft } from "./mdiChevronLeft";

import { mdiCog } from "@mdi/js";

export const MdiCog = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiCog} />
		</SvgIcon>
	);
};
