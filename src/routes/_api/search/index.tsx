import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";
import { getSearchApi } from "@jellyfin/sdk/lib/utils/api/search-api";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./search.scss";
import {
	AppBar,
	Box,
	Chip,
	Fade,
	FormControl,
	Grow,
	IconButton,
	InputBase,
	MenuItem,
	OutlinedInput,
	Select,
	type SelectChangeEvent,
	Typography,
	useScrollTrigger,
} from "@mui/material";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/shallow";
import BackButton from "@/components/buttons/backButton";
import { UserAvatarMenu } from "@/components/userAvatarMenu";
import useDebounce from "@/utils/hooks/useDebounce";
import { useCentralStore } from "@/utils/store/central";
import useSearchStore from "@/utils/store/search";

export const Route = createFileRoute("/_api/search/")({
	component: SearchPage,
	validateSearch: (search: Record<string, unknown>): { query: string } => {
		return { query: search.query as string };
	},
});

const CATEGORIES = [
	{ label: "Movies", value: "Movie", kind: BaseItemKind.Movie },
	{ label: "TV Shows", value: "Series", kind: BaseItemKind.Series },
	{ label: "Episodes", value: "Episode", kind: "Episode" },
	{ label: "Music", value: "MusicAlbum", kind: BaseItemKind.MusicAlbum },
	{ label: "Artists", value: "MusicArtist", kind: BaseItemKind.MusicArtist },
	{ label: "People", value: "Person", kind: "Person" },
	{ label: "Books", value: "Book", kind: BaseItemKind.Book },
];

function SearchPage() {
	const api = Route.useRouteContext().api;
	const navigate = useNavigate();
	const { query } = Route.useSearch();
	const [setBackdrop] = useBackdropStore(useShallow((s) => [s.setBackdrop]));
	const user = useCentralStore((s) => s.currentUser);

	const [searchTerm, setSearchTerm] = useState(query ?? "");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

	useEffect(() => {
		if (query && query !== searchTerm) {
			setSearchTerm(query);
		}
	}, [query]);

	useEffect(() => {
		if (debouncedSearchTerm !== query) {
			navigate({
				to: "/search",
				search: { query: debouncedSearchTerm ?? "" },
				replace: true,
			});
		}
	}, [debouncedSearchTerm, navigate]);

	useEffect(() => {
		setBackdrop("");
	}, []);

	const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
		const {
			target: { value },
		} = event;
		setSelectedCategories(typeof value === "string" ? value.split(",") : value);
	};

	const activeCategories = useMemo(() => {
		if (selectedCategories.length === 0) return CATEGORIES;
		return CATEGORIES.filter((cat) => selectedCategories.includes(cat.value));
	}, [selectedCategories]);

	return (
		<div className="search-page scrollY">
			<div
				className={`search-page-bg ${debouncedSearchTerm ? "active" : ""}`}
			/>

			<SearchAppBar
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				selectedCategories={selectedCategories}
				handleCategoryChange={handleCategoryChange}
				handleClearCategories={() => setSelectedCategories([])}
			/>

			<div
				className="search-page-content"
				style={{
					paddingTop: "2.4em",
				}}
			>
				{debouncedSearchTerm ? (
					<SearchResultsList
						categories={activeCategories}
						query={debouncedSearchTerm}
						api={api}
						user={user}
					/>
				) : (
					<Fade in timeout={800}>
						<Box className="search-empty-state">
							<Box className="icon-stack">
								<span className="material-symbols-rounded icon-lg">movie</span>
								<span className="material-symbols-rounded icon-sm">
									music_note
								</span>
								<span className="material-symbols-rounded icon-md">tv</span>
							</Box>
							<Typography variant="h4" fontWeight={600} gutterBottom>
								Explore your library
							</Typography>
							<Typography variant="body1" sx={{ opacity: 0.6, maxWidth: 400 }}>
								Search for movies, tv shows, music, people and more.
							</Typography>
						</Box>
					</Fade>
				)}
			</div>
			<Outlet />
		</div>
	);
}

interface SearchAppBarProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	selectedCategories: string[];
	handleCategoryChange: (event: SelectChangeEvent<string[]>) => void;
	handleClearCategories: () => void;
}

function SearchAppBar({
	searchTerm,
	setSearchTerm,
	selectedCategories,
	handleCategoryChange,
	handleClearCategories,
}: SearchAppBarProps) {
	const scrollTrigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 20,
	});

	const appBarStyling = useMemo(
		() => ({ backgroundColor: "transparent", paddingRight: "0 !important" }),
		[],
	);

	const navigate = useNavigate();
	const handleNavigateToHome = useCallback(() => navigate({ to: "/home" }), []);
	const handleNavigateToFavorite = useCallback(() => {
		navigate({ to: "/favorite" });
	}, []);

	const toggleSearchDialog = useSearchStore(
		useShallow((s) => s.toggleSearchDialog),
	);

	return (
		<AppBar
			className={
				scrollTrigger
					? "appBar search-header scrolling flex flex-row"
					: "appBar search-header flex flex-row"
			}
			style={appBarStyling}
			elevation={0}
			color="transparent"
		>
			<div className="flex flex-row" style={{ gap: "0.6em" }}>
				<IconButton disabled>
					<div className="material-symbols-rounded">menu</div>
				</IconButton>
				<BackButton />
				<IconButton onClick={handleNavigateToHome}>
					<div
						className={
							location.pathname === "/home"
								? "material-symbols-rounded fill"
								: "material-symbols-rounded"
						}
					>
						home
					</div>
				</IconButton>
			</div>
			<div
				className="flex flex-row library-header-center"
				style={{ gap: "0.6em" }}
			>
				<Box className="search-input-container">
					<span className="material-symbols-rounded search-icon">search</span>
					<InputBase
						className="search-input"
						placeholder="Search library..."
						fullWidth
						autoFocus
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						endAdornment={
							searchTerm && (
								<IconButton
									size="small"
									onClick={() => setSearchTerm("")}
									sx={{ color: "white" }}
								>
									<span
										className="material-symbols-rounded"
										style={{ fontSize: "1.2rem" }}
									>
										close
									</span>
								</IconButton>
							)
						}
						size="small"
					/>

					<FormControl size="small" className="search-category-select">
						<Select
							multiple
							displayEmpty
							value={selectedCategories}
							onChange={handleCategoryChange}
							input={
								<OutlinedInput
									endAdornment={
										selectedCategories.length > 0 && (
											<IconButton
												size="small"
												onMouseDown={(e) => {
													e.stopPropagation();
												}}
												onClick={(e) => {
													e.stopPropagation();
													handleClearCategories();
												}}
												sx={{ mr: 2, p: 0.5 }}
											>
												<span
													className="material-symbols-rounded"
													style={{ fontSize: "1rem" }}
												>
													close
												</span>
											</IconButton>
										)
									}
								/>
							}
							IconComponent={(props) => (
								<span
									{...props}
									className={`material-symbols-rounded ${props.className}`}
								>
									expand_more
								</span>
							)}
							renderValue={(selected) => {
								if (selected.length === 0)
									return (
										<Typography
											variant="body2"
											color="textSecondary"
											sx={{ opacity: 0.7 }}
										>
											Types
										</Typography>
									);
								return (
									<Box
										sx={{
											display: "flex",
											flexWrap: "nowrap",
											gap: 0.5,
											overflow: "hidden",
											maxWidth: "100%",
											maskImage:
												"linear-gradient(to right, black 85%, transparent 100%)",
										}}
									>
										{selected.map((value) => {
											const label =
												CATEGORIES.find((c) => c.value === value)?.label ||
												value;
											return (
												<Chip
													key={value}
													label={label}
													size="small"
													sx={{ height: 24 }}
												/>
											);
										})}
									</Box>
								);
							}}
							MenuProps={{
								PaperProps: {
									className: "glass-menu",
								},
								disableScrollLock: true,
							}}
							size="small"
						>
							<MenuItem disabled value="">
								<Typography variant="overline" color="textSecondary">
									Filter by Type
								</Typography>
							</MenuItem>
							{CATEGORIES.map((cat) => (
								<MenuItem key={cat.value} value={cat.value}>
									{cat.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
			</div>
			<div className="flex flex-row" style={{ gap: "0.6em" }}>
				<IconButton onClick={toggleSearchDialog}>
					<span className="material-symbols-rounded">search</span>
				</IconButton>
				<IconButton onClick={handleNavigateToFavorite}>
					<div className="material-symbols-rounded">favorite</div>
				</IconButton>
				<UserAvatarMenu />
			</div>
		</AppBar>
	);
}

function SearchResultsList({ categories, query, api, user }: any) {
	// Lift state to know if we have ANY results
	const [resultsStatus, setResultsStatus] = useState<Record<string, boolean>>(
		{},
	);

	const handleResultUpdate = (catValue: string, hasResults: boolean) => {
		setResultsStatus((prev) => {
			if (prev[catValue] === hasResults) return prev;
			return { ...prev, [catValue]: hasResults };
		});
	};

	// Derived state: are *all* queried categories empty?
	// We only know for sure if all active categories have reported back false.
	// This is tricky with async. A better way implies checking isLoading.
	// For now, we render the sections; if they are empty, they render null.
	// If ALL render null, we show "No Results".

	// Simpler visual fix: Render "No results found" at the bottom if nothing appears?
	// No, that looks broken.

	// Let's use a timeout or assume if no results update to true after X time.

	const _hasAnyResults = Object.values(resultsStatus).some((v) => v);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: "1em", pb: 4 }}>
			{categories.map((cat: any) => (
				<CategorySection
					key={cat.value}
					category={cat}
					query={query}
					api={api}
					user={user}
					onResult={(hasItems: boolean) =>
						handleResultUpdate(cat.value, hasItems)
					}
				/>
			))}

			{/* 
               Only show "No results" if we are confident. 
               Since we don't have a global loading state here, 
               checking `!hasAnyResults` immediately causes flickers.
               Better to handle "No results" inside the sections or leave it blank?
               User asked for "User needs to know search result is empty".
             */}
			<NoResultsDetector
				categories={categories}
				resultsStatus={resultsStatus}
			/>
		</Box>
	);
}

function NoResultsDetector({ categories, resultsStatus }: any) {
	// Wait for all categories to report status
	const allReported = categories.every(
		(c: any) => resultsStatus[c.value] !== undefined,
	);
	const hasAny = Object.values(resultsStatus).some((v) => v);

	if (allReported && !hasAny) {
		return (
			<Fade in>
				<Box className="search-no-results">
					<Typography variant="h6">No results found</Typography>
					<Typography variant="body2" sx={{ opacity: 0.6 }}>
						Try adjusting your search or filters.
					</Typography>
				</Box>
			</Fade>
		);
	}
	return null;
}

function CategorySection({ category, query, api, user, onResult }: any) {
	const limit = 20;

	const { data, isLoading } = useQuery({
		queryKey: ["search", "category", category.value, query],
		queryFn: async () => {
			if (!api || !user?.Id) return { items: [], total: 0 };

			if (category.value === "Person") {
				const res = await getPersonsApi(api).getPersons({
					userId: user.Id,
					searchTerm: query,
					limit,
				});
				return { items: res.data.Items, total: res.data.TotalRecordCount };
			}

			if (category.value === "Episode") {
				const res = await getSearchApi(api).getSearchHints({
					userId: user.Id,
					searchTerm: query,
					limit,
					includeItemTypes: ["Episode"],
				});
				return {
					items: res.data.SearchHints,
					total: res.data.TotalRecordCount,
				};
			}

			const res = await getItemsApi(api).getItems({
				userId: user.Id,
				searchTerm: query,
				includeItemTypes: [category.kind],
				recursive: true,
				limit,
			});
			return { items: res.data.Items, total: res.data.TotalRecordCount };
		},
		enabled: !!query,
	});

	useEffect(() => {
		if (!isLoading && data) {
			onResult((data.items?.length || 0) > 0);
		} else if (!isLoading && !data) {
			onResult(false);
		}
	}, [data, isLoading, onResult]);

	if (isLoading) return <CategorySkeleton />;
	if (!data?.items || data.items.length === 0) return null;

	// ... (Card mapping logic same as before) ...
	return (
		<Grow in>
			<div>
				<CardScroller
					title={category.label}
					displayCards={category.value === "Episode" ? 4 : 7}
					disableDecoration
				>
					{data.items.map((item: any) => {
						let props: any = {
							cardTitle: item?.Name,
							imageType: "Primary",
							cardCaption: item?.ProductionYear,
							cardType: "portrait",
						};

						if (category.value === "Series") {
							props.cardCaption = `${item.ProductionYear || ""}`;
						} else if (
							category.value === "MusicAlbum" ||
							category.value === "MusicArtist" ||
							category.value === "Person"
						) {
							props.cardType = "square";
						} else if (category.value === "Episode") {
							props = {
								cardTitle: item.Series,
								imageType: "Primary",
								cardCaption: `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`,
								cardType: "thumb",
							};
						}

						return (
							<Card
								key={item.Id}
								item={item}
								{...props}
								queryKey={["search", "category", category.value, query]}
								userId={user?.Id}
							/>
						);
					})}
				</CardScroller>
			</div>
		</Grow>
	);
}

function CategorySkeleton() {
	return (
		<Box sx={{ mb: 4, ml: 2, mr: 2 }}>
			<Box
				sx={{
					height: 32,
					width: 200,
					bgcolor: "rgba(255,255,255,0.05)",
					borderRadius: 2,
					mb: 2,
				}}
			/>
			<Box sx={{ display: "flex", gap: 2, overflow: "hidden" }}>
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Box
						key={i}
						sx={{
							height: 260,
							minWidth: 170,
							bgcolor: "rgba(255,255,255,0.03)",
							borderRadius: 3,
						}}
					/>
				))}
			</Box>
		</Box>
	);
}

export default SearchPage;
