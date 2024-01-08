import SvgIcon from "@mui/material/SvgIcon";

import { mdiAlbum } from "@mdi/js";

export const MdiAlbum = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiAlbum} />
		</SvgIcon>
	);
};
