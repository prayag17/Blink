/** @format */

import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

import "./textLink.module.scss";

const TextLink = ({ text, location, variant, otherProps }) => {
	const navigate = useNavigate();

	return (
		<Typography
			variant={variant}
			className="link"
			onClick={() => navigate(location)}
			{...otherProps}
		>
			{text}
		</Typography>
	);
};

export default TextLink;
