import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

import "./textLink.module.scss";

const TextLink = ({ children, location, variant, otherProps }) => {
	const navigate = useNavigate();

	return (
		<Typography
			variant={variant}
			className="link flex"
			onClick={() => navigate(location)}
			{...otherProps}
		>
			{children}
		</Typography>
	);
};

export default TextLink;
