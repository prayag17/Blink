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
		white: {
			main: "#ffffff",
		},
		mode: "dark",
	},
	typography: {
		fontFamily: "Noto Sans",
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: "100px",
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					backdropFilter: "blur(5px)",
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {},
			},
		},
		MuiMenu: {
			styleOverrides: {
				paper: {
					borderRadius: "10px",
					// boxShadow: "0 0 5px  hsl(273, 100%, 36%)",
					background: "hsl(256, 100%, 2%, 40%)",
					backdropFilter: "blur(20px)",
					// border: "1.8px solid hsl(273, 100%, 36%)",
				},
			},
			defaultProps: {
				disableScrollLock: true,
			},
		},
	},
});
