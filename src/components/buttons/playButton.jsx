/** @format */

import IconButton from "@mui/material/IconButton";
import { MdiPlayOutline } from "../icons/mdiPlayOutline";

const PlayButton = ({ className, sx, iconProps }) => {
	return (
		<IconButton
			className={className}
			onClick={(e) => e.stopPropagation()}
			sx={sx}
			disabled
		>
			<MdiPlayOutline {...iconProps} />
		</IconButton>
	);
};

export default PlayButton;
