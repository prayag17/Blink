import { createTheme } from "@mui/material/styles";
import {
	clrAccentDefault,
	clrBackgroundDark,
	clrBackgroundDefault,
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
					background: "hsl(256, 100%, 2%, 40%)",
					backdropFilter: "blur(20px)",
					border: "1px solid rgb(255 255 255 / 0.1)",
				},
				list: {
					padding: "8px",
				},
			},
			defaultProps: {
				disableScrollLock: true,
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					borderRadius: "4px",
					transition: "250ms",
				},
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: {
					borderRadius: "20px",
					background: "rgb(0 0 0 / 0.5)",
					backdropFilter: "blur(10px)",
					border: "1px solid rgb(255 255 255 / 0.2)",
				},
			},
		},
	},
});
