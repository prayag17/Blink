import { getSetting, setSetting } from "@/utils/storage/settings";
import { FormControlLabel, Switch, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const SettingOption = ({
	setting,
}: { setting: { key: string; name: string; description: string } }) => {
	const initValue = useQuery({
		queryKey: ["setting", setting.key],
		queryFn: async () => {
			const result = await getSetting(setting.key);
			return Boolean(result);
		},
	});
	const [settingVal, setSettingVal] = useState(initValue.data ?? false);
	const { t } = useTranslation();

	return (
		<FormControlLabel
			control={
				<Switch
					color="primary"
					checked={Boolean(settingVal)}
					onChange={(_, checked) => {
						setSetting(setting.key, checked);
						setSettingVal(Boolean(checked));
					}}
					disabled={initValue.isLoading}
					name={t(setting.name)}
				/>
			}
			label={
				<div className="settings-option-info">
					<Typography variant="subtitle1" fontWeight={400}>
						{t(setting.name)}
					</Typography>
					<Typography
						variant="caption"
						className="settings-option-info-caption"
					>
						{t(setting.description)}
					</Typography>
				</div>
			}
			labelPlacement="start"
			className="settings-option"
		/>
	);
};

export default SettingOption;