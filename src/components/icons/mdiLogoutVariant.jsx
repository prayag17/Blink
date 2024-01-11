import SvgIcon from "@mui/material/SvgIcon";

import { mdiLogoutVariant } from "@mdi/js";

export const MdiLogoutVariant = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiLogoutVariant} />
		</SvgIcon>
	);
};
