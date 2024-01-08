import SvgIcon from "@mui/material/SvgIcon";

import { mdiSkipNext } from "@mdi/js";

export const MdiSkipNext = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiSkipNext} />
		</SvgIcon>
	);
};
