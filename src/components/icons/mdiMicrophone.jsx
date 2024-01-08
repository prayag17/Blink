
import SvgIcon from "@mui/material/SvgIcon";

import { mdiMicrophone } from "@mdi/js";

export const MdiMicrophone = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiMicrophone} />
		</SvgIcon>
	);
};
