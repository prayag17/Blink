
import SvgIcon from "@mui/material/SvgIcon";

import { mdiBook } from "@mdi/js";

export const MdiBook = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiBook} />
		</SvgIcon>
	);
};
