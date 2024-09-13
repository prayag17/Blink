import Typography from "@mui/material/Typography";

import "./textLink.scss";
import { useNavigate } from "@tanstack/react-router";

const TextLink = ({ children, location, variant, otherProps }) => {
	const navigate = useNavigate();

	return (
		<Typography
			variant={variant}
			className="link flex"
			onClick={() => navigate({ to: location })}
			{...otherProps}
		>
			{children}
		</Typography>
	);
};

export default TextLink;
