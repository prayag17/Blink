import { Typography } from "@mui/material";
import { Link, type LinkProps } from "@tanstack/react-router";
import React from "react";

import "./tagChip.scss";

const TagChip = ({
	label,
	linkProps,
}: { label: string; linkProps?: LinkProps }) => {
	return (
		<Link className="tag" to="/search" search={{ query: label }} {...linkProps}>
			<Typography variant="subtitle2" fontWeight={300}>
				{label}
			</Typography>
		</Link>
	);
};

export default TagChip;