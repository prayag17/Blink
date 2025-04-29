import type { CultureDto } from "@jellyfin/sdk/lib/generated-client";
import {
	FormControlLabel,
	MenuItem,
	TextField,
	Typography,
} from "@mui/material";
import React, { useState } from "react";

const SettingOptionSelect = ({
	setting,
	options,
	userValue,
}: {
	setting: { name: string; description: string };
	options: CultureDto[];
	userValue: string | null;
}) => {
	const [value, setValue] = useState(
		userValue === "" ? "anyLanguage" : userValue,
	);
	return (
		<FormControlLabel
			value={value}
			control={
				<TextField select onChange={(e) => setValue(e.target.value)}>
					<MenuItem key={"anyLanguage"} value={"anyLanguage"}>
						Any Language
					</MenuItem>
					{options.map((option) => (
						<MenuItem
							key={option.ThreeLetterISOLanguageName}
							value={option.ThreeLetterISOLanguageName ?? "none"}
						>
							{option.DisplayName}
						</MenuItem>
					))}
				</TextField>
			}
			label={
				<div className="settings-option-info">
					<Typography variant="subtitle1" fontWeight={400}>
						{setting.name}
					</Typography>
					<Typography
						variant="caption"
						className="settings-option-info-caption"
					>
						{setting.description}
					</Typography>
				</div>
			}
			labelPlacement="start"
			className="settings-option"
		/>
	);
};

export default SettingOptionSelect;
