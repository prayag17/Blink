import { createTheme } from "@mui/material/styles";
import {
	clrAccentDefault,
	clrBackgroundDark,
	clrBackgroundDefault,
	clrSecondaryDefault, //@ts-ignore
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
		//@ts-expect-error
		white: augmentColor({ color: { main: "#ffffff" } }),
		black: augmentColor({ color: { main: "#000" } }),
		mode: "dark",
	},
	typography: {
		fontFamily: "Plus Jakarta Sans Variable",
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
		MuiInputLabel: {
			styleOverrides: {
				root: {
					marginLeft: "6px",
					color: "rgba(255, 255, 255, 0.5)",
					"&.Mui-focused": {
						color: clrAccentDefault,
					},
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				notchedOutline: {
					paddingLeft: "15px",
				},
				root: {
					backgroundColor: "rgba(0,0,0,0.2)",
					borderRadius: "16px",
					transition: "border-color 0.2s, background-color 0.2s",
					"&.Mui-focused": {
						backgroundColor: "rgba(0,0,0,0.3)",
					},
					"&:hover": {
						backgroundColor: "rgba(0,0,0,0.25)",
					},
					"& .MuiOutlinedInput-notchedOutline": {
						borderColor: "rgba(255,255,255,0.1)",
					},
					"&:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: "rgba(255,255,255,0.3)",
					},
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: clrAccentDefault,
					},
				},
			},
		},
	},
});
