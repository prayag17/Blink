
import SvgIcon from "@mui/material/SvgIcon";

import { mdiYoutube } from "@mdi/js";

export const MdiYoutube = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiYoutube} />
		</SvgIcon>
	);
};
