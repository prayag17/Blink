import SvgIcon from "@mui/material/SvgIcon";

import { mdiSortDescending } from "@mdi/js";

export const MdiSortDescending = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiSortDescending} />
		</SvgIcon>
	);
};
