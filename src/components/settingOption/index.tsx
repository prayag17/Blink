import { getSetting, setSetting } from "@/utils/storage/settings";
import { FormControlLabel, Switch, Typography } from "@mui/material";
import React, { useState } from "react";

const SettingOption = ({
	setting,
}: { setting: { key: string; name: string; description: string } }) => {
	const [settingVal, setSettingVal] = useState(
		async () => (await getSetting(setting.key)) ?? false,
	);
	return (
		<FormControlLabel
			control={
				<Switch
					color="primary"
					checked={settingVal}
					onChange={(e) => {
						setSetting(setting.key, e.target.checked);
						setSettingVal(e.target.checked);
					}}
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