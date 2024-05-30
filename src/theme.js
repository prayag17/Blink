import { createTheme } from "@mui/material/styles";
import {
	clrAccentDefault,
	clrBackgroundDark,
	clrBackgroundDefault,
	clrBackgroundLight,
	clrSecondaryDefault,
} from "./palette.module.scss";
const { palette } = createTheme({});
const { augmentColor } = palette;
export const theme = createTheme({
	palette: {
		primary: augmentColor({
			color: {
				main: clrAccentDefault,
			},
		}),
		secondary: augmentColor({
			color: {
				main: clrSecondaryDefault,
			},
		}),
		background: {
			default: clrBackgroundDefault,
			paper: clrBackgroundDark,
		},
		white: augmentColor({ color: { main: "#ffffff" } }),
		black: augmentColor({ color: { main: "#000" } }),
		mode: "dark",
	},
	typography: {
		fontFamily: "Noto Sans Variable",
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
					border: "1px solid rgb(255 255 255 / 0.1)",
				},
				list: {
					padding: "8px",
				},
			},
			defaultProps: {
				disableScrollLock: true,
				slotProps: {
					paper: {
						className: "glass",
					},
				},
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
				},
			},
			defaultProps: {
				PaperProps: {
					className: "glass",
				},
			},
		},
	},
});
