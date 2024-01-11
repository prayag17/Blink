import SvgIcon from "@mui/material/SvgIcon";

import { mdiHomeVariant } from "@mdi/js";

export const MdiHomeVariant = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiHomeVariant} />
		</SvgIcon>
	);
};
