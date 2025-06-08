import {
	Button,
	FormControlLabel,
	MenuItem,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

import "../settings.scss";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { getLocalizationApi } from "@jellyfin/sdk/lib/utils/api/localization-api";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import CircularPageLoadingAnimation from "@/components/circularPageLoadingAnimation";
// import { getDisplayPreferencesApi } from "@jellyfin/sdk/lib/utils/api/display-preferences-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useForm } from "@tanstack/react-form";
import { useSnackbar } from "notistack";

export const Route = createFileRoute("/_api/settings/preferences")({
	component: RouteComponent,
	pendingComponent: () => <CircularPageLoadingAnimation />,
});

function RouteComponent() {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const cultures = useSuspenseQuery({
		queryKey: ["settings", "cultures"],
		queryFn: async () => {
			if (!api) return;
			const result = await getLocalizationApi(api).getCultures();
			return result.data;
		},
	});

	const { enqueueSnackbar } = useSnackbar();

	const form = useForm({
		defaultValues: {
			preferredAudioLanguage:
				user?.Configuration?.AudioLanguagePreference ?? "anyLanguage",
			playDefaultAudioTrack: user?.Configuration?.PlayDefaultAudioTrack,
			preferredSubtitleLanguage: user?.Configuration?.SubtitleLanguagePreference
				? user?.Configuration?.SubtitleLanguagePreference
				: "anyLanguage",
			rememberSubtitleSelections:
				user?.Configuration?.RememberSubtitleSelections,
		},
		onSubmit: async (values) => {
			if (!api) return;
			await getUserApi(api).updateUserConfiguration({
				userId: user?.Id,
				userConfiguration: {
					AudioLanguagePreference: values.value.preferredAudioLanguage,
					PlayDefaultAudioTrack: values.value.playDefaultAudioTrack,
					SubtitleLanguagePreference: values.value.preferredSubtitleLanguage,
					RememberSubtitleSelections: values.value.rememberSubtitleSelections,
				},
			});
			// await getDisplayPreferencesApi(api).updateDisplayPreferences({
			// 	userId: user?.Id,
			// 	displayPreferencesId: api.deviceInfo.id,
			// 	client: "blink",
			// 	displayPreferencesDto: {
			// 		...displayPreferences.data,
			// 		CustomPrefs: {
			// 			RememberVolume: JSON.stringify(values.value.rememberVolume),
			// 		},
			// 	},
			// });
			enqueueSnackbar("Settings saved", {
				variant: "success",
			});
		},
	});

	return (
		<div className="settings-page-scrollY">
			<Typography variant="h4">Preferences</Typography>
			{/* <form.Pro */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				onError={() =>
					enqueueSnackbar("Error saving settings", { variant: "error" })
				}
				className="settings-form"
			>
				<form.Field
					name="preferredAudioLanguage"
					// children={}
				>
					{(field) => {
						return (
							<FormControlLabel
								control={
									<TextField
										defaultValue={field.state.value}
										select
										hiddenLabel
										variant="filled"
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										style={{
											width: "18em",
										}}
									>
										<MenuItem key={"anyLanguage"} value={"anyLanguage"}>
											Any Language
										</MenuItem>
										{cultures.data?.map((option) => (
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
											Preferred Audio Language
										</Typography>
										<Typography
											variant="caption"
											className="settings-option-info-caption"
										>
											Choose your preferred audio language.
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
						);
					}}
				</form.Field>
				<form.Field
					name="playDefaultAudioTrack"
					// children={}
				>
					{(field) => {
						return (
							<FormControlLabel
								control={
									<Switch
										checked={field.state.value}
										onChange={(_, checked) => field.handleChange(checked)}
										onBlur={field.handleBlur}
									/>
								}
								label={
									<div className="settings-option-info">
										<Typography variant="subtitle1" fontWeight={400}>
											Play default audio track regardless of language
										</Typography>
										<Typography
											variant="caption"
											className="settings-option-info-caption"
										>
											Play the default audio track of the media item, even if it
											does not match your preferred audio language.
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
						);
					}}
				</form.Field>
				<form.Field
					name="preferredSubtitleLanguage"
					// children={}
				>
					{(field) => {
						return (
							<FormControlLabel
								control={
									<TextField
										defaultValue={field.state.value}
										select
										hiddenLabel
										variant="filled"
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										style={{
											width: "18em",
										}}
									>
										<MenuItem key={"anyLanguage"} value={"anyLanguage"}>
											Any Language
										</MenuItem>
										{cultures.data?.map((option) => (
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
											Preferred Subtitle Language
										</Typography>
										<Typography
											variant="caption"
											className="settings-option-info-caption"
										>
											Choose your preferred subtitle language.
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
						);
					}}
				</form.Field>
				<form.Field
					name="rememberSubtitleSelections"
					// children={}
				>
					{(field) => {
						return (
							<FormControlLabel
								control={
									<Switch
										checked={field.state.value}
										onChange={(_, checked) => field.handleChange(checked)}
										onBlur={field.handleBlur}
									/>
								}
								label={
									<div className="settings-option-info">
										<Typography variant="subtitle1" fontWeight={400}>
											Set subtitle track based on previous item
										</Typography>
										<Typography
											variant="caption"
											className="settings-option-info-caption"
										>
											Try to set the subtitle track to the closest match to the
											last video.
										</Typography>
									</div>
								}
								labelPlacement="start"
								className="settings-option"
							/>
						);
					}}
				</form.Field>
				<Button type="submit" size="large" variant="contained">
					Save
				</Button>
			</form>
			{/* <FormControlLabel
				value={currentCulture}
				control={
					<TextField select onChange={(e) => setCurrentCulture(e.target.value)}>
						<MenuItem key={"anyLanguage"} value={"anyLanguage"}>
							Any Language
						</MenuItem>
						{cultures.data?.map((option) => (
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
			/> */}
		</div>
	);
}
