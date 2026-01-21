import { getGenresApi } from "@jellyfin/sdk/lib/utils/api/genres-api";
import { getMusicGenresApi } from "@jellyfin/sdk/lib/utils/api/music-genres-api";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	FormGroup,
	IconButton,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import React, { useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import type { FILTERS } from "@/utils/constants/library";
import { getLibraryQueryOptions } from "@/utils/queries/library";
import { useLibraryStateStore } from "@/utils/store/libraryState";

const route = getRouteApi("/_api/library/$id");

const FILTER_LABELS: Record<FILTERS, string> = {
	isPlayed: "Played",
	isUnPlayed: "Unplayed",
	isResumable: "Resumable",
	isFavorite: "Favorite",
	hasSubtitles: "Has Subtitles",
	hasTrailer: "Has Trailer",
	hasSpecialFeature: "Special Feature",
	hasThemeSong: "Theme Song",
	hasThemeVideo: "Theme Video",
	isSD: "SD",
	isHD: "HD",
	is4K: "4K",
	is3D: "3D",
};

interface FiltersDialogProps {
	open: boolean;
	onClose: () => void;
}

export const FiltersDialog: React.FC<FiltersDialogProps> = React.memo(
	({ open, onClose }) => {
		const { id: currentLibraryId } = route.useParams();
		const { api, user } = route.useRouteContext();
		const { routeFilters, routeVideoTypes, routeGenreIds } =
			useLibraryStateStore(
				useShallow((s) => {
					const slice = s.libraries[currentLibraryId || ""];
					return {
						routeFilters: slice?.filters,
						routeVideoTypes: slice?.videoTypesState,
						routeGenreIds: slice?.genreIds,
					};
				}),
			);
		const updateLibrary = useLibraryStateStore((s) => s.updateLibrary);
		const initial = useMemo(
			() => ({ ...(routeFilters || {}) }),
			[routeFilters],
		);
		const [localFilters, setLocalFilters] =
			useState<Record<string, boolean | undefined>>(initial);
		const initialVideo = useMemo(
			() => ({ ...(routeVideoTypes || {}) }),
			[routeVideoTypes],
		);
		const [localVideoTypes, setLocalVideoTypes] =
			useState<Record<string, boolean>>(initialVideo);
		const initialGenres = useMemo(
			() => [...(routeGenreIds || [])] as string[],
			[routeGenreIds],
		);
		const [localGenreIds, setLocalGenreIds] = useState<string[]>(initialGenres);
		const dirty = useMemo(
			() =>
				JSON.stringify(initial) !== JSON.stringify(localFilters) ||
				JSON.stringify(initialVideo) !== JSON.stringify(localVideoTypes) ||
				JSON.stringify(initialGenres) !== JSON.stringify(localGenreIds),
			[
				initial,
				localFilters,
				initialVideo,
				localVideoTypes,
				initialGenres,
				localGenreIds,
			],
		);
		const debounceRef = useRef<number | null>(null);
		const currentLibrary = useSuspenseQuery(
			getLibraryQueryOptions(api, user?.Id, currentLibraryId),
		);
		const collectionType = currentLibrary.data.CollectionType;
		const isVideoCollection = ["movies", "tvshows", "boxsets"].includes(
			String(collectionType || "").toLowerCase(),
		);

		// Fetch genres for this library (music uses music-genres API)
		const { data: genresData } = useQuery({
			queryKey: ["library", "genres", currentLibraryId, collectionType],
			queryFn: async () => {
				if (!api || !user?.Id || !currentLibraryId) return { Items: [] } as any;
				if (String(collectionType || "").toLowerCase() === "music") {
					const res = await getMusicGenresApi(api).getMusicGenres({
						parentId: currentLibraryId,
						userId: user.Id,
					});
					return res.data;
				}
				const res = await getGenresApi(api).getGenres({
					parentId: currentLibraryId,
					userId: user.Id,
				});
				return res.data;
			},
			staleTime: 10 * 60 * 1000,
			enabled: !!open && !!api && !!user?.Id && !!currentLibraryId,
		});

		const handleToggle = (key: FILTERS) => {
			setLocalFilters((prev) => {
				const next = { ...prev };
				// isHD special: undefined if unchecked instead of false
				if (key === "isHD") {
					if (next[key]) delete next[key];
					else next[key] = true;
				} else {
					next[key] = !next[key];
				}
				return next;
			});
		};

		const apply = () => {
			if (!currentLibraryId) return;
			if (debounceRef.current) window.clearTimeout(debounceRef.current);
			debounceRef.current = window.setTimeout(() => {
				updateLibrary(currentLibraryId, {
					filters: localFilters as any,
					videoTypesState: localVideoTypes as any,
					genreIds: localGenreIds as any,
				});
				onClose();
			}, 40);
		};

		const clearAll = () => {
			setLocalFilters({});
			setLocalVideoTypes({});
			setLocalGenreIds([]);
		};

		const restore = () => setLocalFilters(initial);
		const restoreVideo = () => setLocalVideoTypes(initialVideo);
		const restoreGenres = () => setLocalGenreIds(initialGenres);

		return (
			<Dialog
				open={open}
				onClose={onClose}
				fullWidth
				maxWidth="sm"
				keepMounted
				PaperProps={{ className: "glass-dialog-paper" }}
			>
				<DialogTitle>Filters</DialogTitle>
				<DialogContent
					dividers
					sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
				>
					<Stack spacing={1.25}>
						<Accordion
							disableGutters
							sx={{
								backgroundColor: "transparent",
								boxShadow: "none",
								m: 0,
								"&:before": { display: "none" },
								"&:not(:last-of-type)": {
									borderBottom: "1px solid rgba(255,255,255,0.12)",
								},
							}}
						>
							<AccordionSummary
								sx={{
									minHeight: 40,
									"& .MuiAccordionSummary-content": { my: 0 },
								}}
								expandIcon={
									<span className="material-symbols-rounded">expand_more</span>
								}
							>
								<Typography variant="subtitle2">General</Typography>
							</AccordionSummary>
							<AccordionDetails sx={{ px: 1.5, py: 1.25 }}>
								<FormGroup>
									{(
										[
											"isPlayed",
											"isUnPlayed",
											"isResumable",
											"isFavorite",
										] as FILTERS[]
									).map((k) => (
										<FormControlLabel
											key={k}
											control={
												<Checkbox
													checked={!!localFilters[k]}
													onChange={() => handleToggle(k)}
													size="small"
												/>
											}
											label={FILTER_LABELS[k]}
										/>
									))}
								</FormGroup>
							</AccordionDetails>
						</Accordion>

						{isVideoCollection && (
							<Accordion
								disableGutters
								sx={{
									backgroundColor: "transparent",
									boxShadow: "none",
									m: 0,
									"&:before": { display: "none" },
									"&:not(:last-of-type)": {
										borderBottom: "1px solid rgba(255,255,255,0.12)",
									},
								}}
							>
								<AccordionSummary
									sx={{
										minHeight: 40,
										"& .MuiAccordionSummary-content": { my: 0 },
									}}
									expandIcon={
										<span className="material-symbols-rounded">
											expand_more
										</span>
									}
								>
									<Typography variant="subtitle2">Video features</Typography>
								</AccordionSummary>
								<AccordionDetails sx={{ px: 1.5, py: 1.25 }}>
									<FormGroup>
										{(
											[
												"hasSubtitles",
												"hasTrailer",
												"hasSpecialFeature",
												"hasThemeSong",
												"hasThemeVideo",
											] as FILTERS[]
										).map((k) => (
											<FormControlLabel
												key={k}
												control={
													<Checkbox
														checked={!!localFilters[k]}
														onChange={() => handleToggle(k)}
														size="small"
													/>
												}
												label={FILTER_LABELS[k]}
											/>
										))}
									</FormGroup>
								</AccordionDetails>
							</Accordion>
						)}

						{isVideoCollection && (
							<Accordion
								disableGutters
								sx={{
									backgroundColor: "transparent",
									boxShadow: "none",
									m: 0,
									"&:before": { display: "none" },
									"&:not(:last-of-type)": {
										borderBottom: "1px solid rgba(255,255,255,0.12)",
									},
								}}
							>
								<AccordionSummary
									sx={{
										minHeight: 40,
										"& .MuiAccordionSummary-content": { my: 0 },
									}}
									expandIcon={
										<span className="material-symbols-rounded">
											expand_more
										</span>
									}
								>
									<Typography variant="subtitle2">Resolution</Typography>
								</AccordionSummary>
								<AccordionDetails sx={{ px: 1.5, py: 1.25 }}>
									<FormGroup>
										{(["isSD", "isHD", "is4K", "is3D"] as FILTERS[]).map(
											(k) => (
												<FormControlLabel
													key={k}
													control={
														<Checkbox
															checked={!!localFilters[k]}
															onChange={() => handleToggle(k)}
															size="small"
														/>
													}
													label={FILTER_LABELS[k]}
												/>
											),
										)}
									</FormGroup>
								</AccordionDetails>
							</Accordion>
						)}

						{isVideoCollection && (
							<Accordion
								disableGutters
								sx={{
									backgroundColor: "transparent",
									boxShadow: "none",
									m: 0,
									"&:before": { display: "none" },
									"&:not(:last-of-type)": {
										borderBottom: "1px solid rgba(255,255,255,0.12)",
									},
								}}
							>
								<AccordionSummary
									sx={{
										minHeight: 40,
										"& .MuiAccordionSummary-content": { my: 0 },
									}}
									expandIcon={
										<span className="material-symbols-rounded">
											expand_more
										</span>
									}
								>
									<Typography variant="subtitle2">Media type</Typography>
								</AccordionSummary>
								<AccordionDetails sx={{ px: 1.5, py: 1.25 }}>
									<FormGroup>
										{(["BluRay", "Dvd", "Iso", "VideoFile"] as const).map(
											(k) => (
												<FormControlLabel
													key={k}
													control={
														<Checkbox
															checked={!!(localVideoTypes as any)[k]}
															onChange={() =>
																setLocalVideoTypes((prev) => ({
																	...(prev || {}),
																	[k]: !(prev as any)?.[k],
																}))
															}
															size="small"
														/>
													}
													label={k}
												/>
											),
										)}
									</FormGroup>
								</AccordionDetails>
							</Accordion>
						)}

						{/* Genres (all collection types) */}
						{(genresData?.Items?.length || 0) > 0 && (
							<Accordion
								disableGutters
								sx={{
									backgroundColor: "transparent",
									boxShadow: "none",
									m: 0,
									"&:before": { display: "none" },
								}}
							>
								<AccordionSummary
									sx={{
										minHeight: 40,
										"& .MuiAccordionSummary-content": { my: 0 },
									}}
									expandIcon={
										<span className="material-symbols-rounded">
											expand_more
										</span>
									}
								>
									<Typography variant="subtitle2">Genres</Typography>
								</AccordionSummary>
								<AccordionDetails sx={{ px: 1.5, py: 1.25 }}>
									<FormGroup>
										{(genresData?.Items || []).map((g: any) => (
											<FormControlLabel
												key={g.Id}
												control={
													<Checkbox
														checked={localGenreIds.includes(g.Id)}
														onChange={() =>
															setLocalGenreIds((prev) =>
																prev.includes(g.Id)
																	? prev.filter((id) => id !== g.Id)
																	: [...prev, g.Id],
															)
														}
														size="small"
													/>
												}
												label={g.Name}
											/>
										))}
									</FormGroup>
								</AccordionDetails>
							</Accordion>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={clearAll}
						color="inherit"
						disabled={Object.keys(localFilters).length === 0}
					>
						Clear
					</Button>
					<Button
						onClick={() => {
							restore();
							restoreVideo();
							restoreGenres();
						}}
						color="inherit"
						disabled={!dirty}
					>
						Reset
					</Button>
					<Button onClick={onClose}>Cancel</Button>
					<Button onClick={apply} disabled={!dirty} variant="contained">
						Apply
					</Button>
				</DialogActions>
			</Dialog>
		);
	},
);
(FiltersDialog as any).displayName = "FiltersDialog";

export const FiltersDialogTrigger: React.FC = () => {
	const [open, setOpen] = React.useState(false);
	const { id: currentLibraryId } = route.useParams();
	const { filters, videoTypesState, genreIds } = useLibraryStateStore(
		useShallow((s) => {
			const slice = s.libraries[currentLibraryId || ""];
			return {
				filters: slice?.filters,
				videoTypesState: slice?.videoTypesState,
				genreIds: slice?.genreIds,
			};
		}),
	);
	const activeCount = useMemo(() => {
		const a = Object.values(filters || {}).filter((v) => v === true).length;
		const b = Object.values(videoTypesState || {}).filter(
			(v) => v === true,
		).length;
		const c = (genreIds || []).length;
		return a + b + c;
	}, [filters, videoTypesState, genreIds]);
	return (
		<>
			<Tooltip
				title={activeCount ? `${activeCount} active filters` : "Filters"}
			>
				<IconButton
					onClick={() => setOpen(true)}
					aria-label="Open filters dialog"
				>
					<span
						className="material-symbols-rounded"
						style={{ position: "relative" }}
					>
						filter_list
						{activeCount > 0 && (
							<span
								style={{
									position: "absolute",
									top: -2,
									right: -4,
									background: "#ff4081",
									color: "#fff",
									fontSize: 10,
									borderRadius: 8,
									lineHeight: 1,
									padding: "2px 4px",
									fontFamily: "Plus Jakarta Sans Variable",
								}}
							>
								{activeCount}
							</span>
						)}
					</span>
				</IconButton>
			</Tooltip>
			<FiltersDialog open={open} onClose={() => setOpen(false)} />
		</>
	);
};

export default FiltersDialog;
