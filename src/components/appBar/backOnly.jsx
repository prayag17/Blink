import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import { useRouter } from "@tanstack/react-router";

export const AppBarBackOnly = () => {
	const { history } = useRouter();

	const handleBack = () => {
		history.go(-1);
	};

	return (
		<AppBar elevation={0} color="transparent" position="fixed">
			<Toolbar>
				<IconButton
					size="large"
					edge="start"
					color="white"
					aria-label="back"
					onClick={handleBack}
					sx={{ mr: 2 }}
				>
					<span className="material-symbols-rounded">arrow_back</span>
				</IconButton>
			</Toolbar>
		</AppBar>
	);
};
