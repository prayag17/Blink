
import SvgIcon from "@mui/material/SvgIcon";

import { mdiPlaylistMusicOutline } from "@mdi/js";

export const MdiPlaylistMusicOutline = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiPlaylistMusicOutline} />
		</SvgIcon>
	);
};
