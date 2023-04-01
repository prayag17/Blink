/** @format */

import MuiAppBar from "@mui/material/AppBar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Toolbar from "@mui/material/Toolbar";
import { MdiMagnify } from "../icons/mdiMagnify";
import { theme } from "../../theme";

import { useSelector } from "react-redux";

import "./appBar.module.scss";

export const AppBar = () => {
	const visible = useSelector((state) => state.appBar.visible);
	const backdropVisible = useSelector((state) => state.appBar.backdrop);

	// console.log(backdropVisible);

	// const trigger = useScrollTrigger({
	// 	disableHysteresis: true,
	// 	threshold: 0,
	// 	// target: document.querySelector(".scrollY"),
	// });

	// console.log(trigger);

	return (
		visible && (
			<MuiAppBar
				sx={{
					width: `calc(100vw - ${theme.spacing(7)} - 10px)`,
					background: backdropVisible
						? theme.palette.background.paper
						: "transparent",
				}}
				className="appBar"
				elevation={backdropVisible ? 6 : 0}
			>
				<Toolbar>
					<TextField
						variant="outlined"
						label="search"
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton size="small">
										<MdiMagnify />
									</IconButton>
								</InputAdornment>
							),
						}}
						size="small"
					/>
				</Toolbar>
			</MuiAppBar>
		)
	);
};
