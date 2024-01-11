import SvgIcon from "@mui/material/SvgIcon";

import { mdiMenu } from "@mdi/js";

export const MdiMenu = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiMenu} />
		</SvgIcon>
	);
};
