/** @format */

import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

import "./textLink.module.scss";

const TextLink = ({ text, location, variant }) => {
	const navigate = useNavigate();

	return (
		<Typography
			variant={variant}
			className="link"
			onClick={() => navigate(location)}
		>
			{text}
		</Typography>
	);
};

export default TextLink;
