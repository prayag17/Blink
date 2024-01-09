import SvgIcon from "@mui/material/SvgIcon";

import { mdiFullscreenExit } from "@mdi/js";

export const MdiFullscreenExit = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiFullscreenExit} />
		</SvgIcon>
	);
};
