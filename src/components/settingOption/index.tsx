import { getSetting, setSetting } from "@/utils/storage/settings";
import { FormControlLabel, Switch, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";

const SettingOption = ({
	setting,
}: {
	setting: {
		key: string;
		name: string;
		description: string;
		type?: string;
		defaultValue?: any;
	};
}) => {
	const initValue = useQuery({
		queryKey: ["setting", setting.key],
		queryFn: async () => {
			const result = await getSetting(setting.key);
			return result !== false ? result : setting.defaultValue;
		},
	});
	
	const [settingVal, setSettingVal] = useState(
		initValue.data ?? setting.defaultValue ?? false
	);
	
	// Path input UI - simple text field
	if (setting.type === "path") {
		return (
			<div className="settings-path-option">
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
			</div>
		);
	}
	
	// Default UI for boolean settings
	return (
		<FormControlLabel
			control={
				<Switch
					color="primary"
					checked={Boolean(settingVal)}
					onChange={async (_, checked) => {
						await setSetting(setting.key, checked);
						setSettingVal(Boolean(checked));
					}}
					disabled={initValue.isLoading}
					name={setting.name}
				/>
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

export default SettingOption;