import SvgIcon from "@mui/material/SvgIcon";

import { mdiImageMultiple } from "@mdi/js";

export const MdiImageMultiple = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiImageMultiple} />
		</SvgIcon>
	);
};
