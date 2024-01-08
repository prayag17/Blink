import SvgIcon from "@mui/material/SvgIcon";

import { mdiDramaMasks } from "@mdi/js";

export const MdiDramaMasks = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiDramaMasks} />
		</SvgIcon>
	);
};
