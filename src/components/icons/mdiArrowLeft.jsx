
import SvgIcon from "@mui/material/SvgIcon";

import { mdiArrowLeft } from "@mdi/js";

export const MdiArrowLeft = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiArrowLeft} />
		</SvgIcon>
	);
};
