import SvgIcon from "@mui/material/SvgIcon";

import { mdiStarHalfFull } from "@mdi/js";

export const MdiStarHalfFull = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiStarHalfFull} />
		</SvgIcon>
	);
};
