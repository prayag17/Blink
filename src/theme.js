/** @format */

import { createTheme } from "@mui/material/styles";
import {
	clrAccentDefault,
	clrBackgroundDefault,
	clrBackgroundDark,
	clrBackgroundLight,
	clrSecondaryDefault,
} from "./palette.module.scss";

export const theme = createTheme({
	palette: {
		primary: {
			main: clrAccentDefault,
			background: {
				main: clrBackgroundDefault,
				light: clrBackgroundLight,
				dark: clrBackgroundDark,
			},
		},
		secondary: {
			main: clrSecondaryDefault,
		},
		background: {
			default: clrBackgroundDefault,
			paper: clrBackgroundDark,
		},
		mode: "dark",
	},
	typography: {
		fontFamily: "Open Sans",
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: "100px",
				},
			},
		},
	},
});
