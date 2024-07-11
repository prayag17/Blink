import React, {
	useState,
	useEffect,
	useLayoutEffect,
	type ChangeEvent,
	useMemo,
	useCallback,
	type MouseEvent,
} from "react";

import { useQuery } from "@tanstack/react-query";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grow from "@mui/material/Grow";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Popper from "@mui/material/Popper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { getArtistsApi } from "@jellyfin/sdk/lib/utils/api/artists-api";
import { getGenresApi } from "@jellyfin/sdk/lib/utils/api/genres-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getMusicGenresApi } from "@jellyfin/sdk/lib/utils/api/music-genres-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";
import { getStudiosApi } from "@jellyfin/sdk/lib/utils/api/studios-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { Card } from "@/components/card/card";
import { EmptyNotice } from "@/components/notices/emptyNotice/emptyNotice";

import GenreView from "@/components/layouts/library/genreView";
import MusicTrack from "@/components/musicTrack";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import { setBackdrop } from "@/utils/store/backdrop";
import {
	type BaseItemDto,
	type BaseItemDtoQueryResult,
	BaseItemKind,
	CollectionType,
	ItemFilter,
	ItemSortBy,
	SortOrder,
	VideoType,
} from "@jellyfin/sdk/lib/generated-client";

import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import {
	FormControl,
	Menu,
	MenuList,
	Stack,
	useScrollTrigger,
} from "@mui/material";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { AxiosResponse } from "axios";
import "./library.scss";
import LibraryItemsSkeleton from "@/components/skeleton/libraryItems";
import { createFileRoute } from "@tanstack/react-router";

type SortByObject = { title: string; value: ItemSortBy };
type ViewObject = { title: string; value: BaseItemKind };
// type allowedFilters = ["movies", "tvshows", "music", "books"];
type allowedFilters = Partial<CollectionType>[];

const useWindowWidth = () => {
	const [width, setWidth] = React.useState(window.innerWidth);

	React.useEffect(() => {
		const onResize = () => setWidth(window.innerWidth);

		window.addEventListener("resize", onResize, {
			capture: false,
			passive: true,
		});

		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, []);

	return width;
};

export const Route = createFileRoute("/_api/library/$id")({
	component: LibraryView,
});

function LibraryView() {
	const api = Route.useRouteContext().api;

	const { id } = Route.useParams();

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const currentLib = useQuery({
		queryKey: ["libraryView", "currentLib", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getItem({
				userId: user.data?.Id,
				itemId: id,
			});
			return result.data;
		},
		enabled: !!user.data,
		networkMode: "always",
		staleTime: 0,
	});

	const [currentViewType, setCurrentViewType] = useState<BaseItemKind>(
		undefined!,
	);
	const availableViewTypes: ViewObject[] = useMemo(() => {
		let result: ViewObject[] = undefined!;
		switch (currentLib.data?.CollectionType) {
			case CollectionType.Movies:
				result = [
					{
						title: "Movies",
						value: BaseItemKind.Movie,
					},
					{
						title: "Trailers",
						value: BaseItemKind.Trailer,
					},
					{
						title: "Collections",
						value: BaseItemKind.CollectionFolder,
					},
					{
						title: "Genres",
						value: BaseItemKind.Genre,
					},
				];
				break;
			case CollectionType.Tvshows:
				result = [
					{ title: "Shows", value: BaseItemKind.Series },
					{ title: "Genre", value: BaseItemKind.Genre },
					{ title: "TV Networks", value: BaseItemKind.Studio },
				];
				break;
			case CollectionType.Boxsets:
				result = [{ title: "Collection", value: BaseItemKind.BoxSet }];
				break;
			default:
				result = [];
		}
		setCurrentViewType(result?.[0]?.value);
		return result;
	}, [currentLib.data?.CollectionType]);

	const [videoTypesState, setVideoTypesState] = useState<
		Record<VideoType, boolean | undefined>
	>({
		VideoFile: undefined,
		Iso: undefined,
		BluRay: undefined,
		Dvd: undefined,
	});

	const [sortBy, setSortBy] = useState<ItemSortBy>("Name");
	const [sortAscending, setSortAscending] = useState(true);
	const disableSort = useMemo(() => {
		switch (currentViewType) {
			case BaseItemKind.Genre:
				return true;
			default:
				return false;
		}
	}, [currentViewType]);
	const sortByOptions: SortByObject[] = useMemo(() => {
		let result: SortByObject[] = undefined!;
		switch (currentLib.data?.CollectionType) {
			case CollectionType.Movies:
				result = [
					{
						title: "Name",
						value: ItemSortBy.SortName,
					},
					{
						title: "Random",
						value: ItemSortBy.Random,
					},
					{
						title: "IMDb Rating",
						value: ItemSortBy.CommunityRating,
					},
					{
						title: "Critics Rating",
						value: ItemSortBy.CriticRating,
					},
					{
						title: "Date Added",
						value: ItemSortBy.DateCreated,
					},
					{
						title: "Date Played",
						value: ItemSortBy.DatePlayed,
					},
					{
						title: "Parental Rating",
						value: ItemSortBy.OfficialRating,
					},
					{
						title: "Play Count",
						value: ItemSortBy.PlayCount,
					},
					{
						title: "Premiere Date",
						value: ItemSortBy.PremiereDate,
					},
					{
						title: "Runtime",
						value: ItemSortBy.Runtime,
					},
				];
				break;
			case CollectionType.Tvshows:
				result = [
					{
						title: "Name",
						value: ItemSortBy.SortName,
					},
					{
						title: "Random",
						value: ItemSortBy.Random,
					},
					{
						title: "IMDb Rating",
						value: ItemSortBy.CommunityRating,
					},
					{
						title: "Date Show Added",
						value: ItemSortBy.DateCreated,
					},
					{
						title: "Date Episode Added",
						value: ItemSortBy.DateLastContentAdded,
					},
					{
						title: "Date Played",
						value: ItemSortBy.DatePlayed,
					},
					{
						title: "Parental Rating",
						value: ItemSortBy.OfficialRating,
					},
					{
						title: "Premiere Date",
						value: ItemSortBy.PremiereDate,
					},
				];
				break;
			case CollectionType.Boxsets:
				result = [
					{
						title: "Name",
						value: ItemSortBy.SortName,
					},
					{
						title: "Random",
						value: ItemSortBy.Random,
					},
					{
						title: "IMDb Rating",
						value: ItemSortBy.CommunityRating,
					},
					{
						title: "Critics Rating",
						value: ItemSortBy.CriticRating,
					},
					{
						title: "Date Added",
						value: ItemSortBy.DateCreated,
					},
					{
						title: "Date Played",
						value: ItemSortBy.DatePlayed,
					},
					{
						title: "Parental Rating",
						value: ItemSortBy.OfficialRating,
					},
					{
						title: "Play Count",
						value: ItemSortBy.PlayCount,
					},
					{
						title: "Premiere Date",
						value: ItemSortBy.PremiereDate,
					},
					{
						title: "Runtime",
						value: ItemSortBy.Runtime,
					},
				];
				break;
			default:
				result = [];
				break;
		}
		setSortBy(result?.[0]?.value);
		return result;
	}, [currentLib.data?.CollectionType]);
	useLayoutEffect(() => {}, [sortByOptions]);

	const [filters, setFilters] = useState<Record<string, undefined | boolean>>({
		isPlayed: false,
		isUnPlayed: false,
		isResumable: false,
		isFavorite: false,
		isLiked: false,
		isUnliked: false,
		hasSubtitles: false,
		hasTrailer: false,
		hasSpecialFeature: false,
		hasThemeSong: false,
		hasThemeVideo: false,
		isBluRay: false,
		isDVD: false,
		isHD: undefined,
		isSD: false,
		is4K: false,
		is3D: false,
	});

	const items = useQuery({
		queryKey: [
			"libraryView",
			"currentLibItems",
			id,
			{
				currentViewType: currentViewType,
				sortAscending: sortAscending,
				sortBy: sortBy,
				filters,
				videoTypesState,
			},
		],
		queryFn: async () => {
			let result: AxiosResponse<BaseItemDtoQueryResult, any>;
			if (currentViewType === "MusicArtist") {
				result = await getArtistsApi(api).getAlbumArtists({
					userId: user.data?.Id,
					parentId: id,
				});
			} else if (currentViewType === "Person") {
				result = await getPersonsApi(api).getPersons({
					userId: user.data?.Id,
					personTypes: ["Actor"],
				});
			} else if (currentViewType === "Genre") {
				result = await getGenresApi(api).getGenres({
					userId: user.data?.Id,
					parentId: id,
				});
			} else if (currentViewType === "MusicGenre") {
				result = await getMusicGenresApi(api).getMusicGenres({
					userId: user.data?.Id,
					parentId: id,
				});
			} else if (currentViewType === "Studio") {
				result = await getStudiosApi(api).getStudios({
					userId: user.data?.Id,
					parentId: id,
				});
			} else if (currentViewType === "BoxSet") {
				const videoTypes: VideoType[] = [];
				if (videoTypesState.BluRay) videoTypes.push(VideoType.BluRay);
				if (videoTypesState.Dvd) videoTypes.push(VideoType.Dvd);
				if (videoTypesState.Iso) videoTypes.push(VideoType.Iso);
				if (videoTypesState.VideoFile) videoTypes.push(VideoType.VideoFile);

				const filtersArray: ItemFilter[] = [];
				if (filters.isPlayed) filtersArray.push(ItemFilter.IsPlayed);
				if (filters.isUnPlayed) filtersArray.push(ItemFilter.IsUnplayed);
				if (filters.isResumable) filtersArray.push(ItemFilter.IsResumable);
				if (filters.isFavorite) filtersArray.push(ItemFilter.IsFavorite);

				result = await getItemsApi(api).getItems({
					userId: user.data?.Id,
					parentId: currentLib.data?.Id,
					recursive:
						currentLib.data?.CollectionType === "boxsets" ? undefined : true,
					// includeItemTypes: [currentViewType],
					sortOrder: [
						sortAscending ? SortOrder.Ascending : SortOrder.Descending,
					],
					sortBy: [sortBy],
					filters: filtersArray,
					hasSubtitles: filters.hasSubtitles ? true : undefined,
					hasTrailer: filters.hasTrailer ? true : undefined,
					hasSpecialFeature: filters.hasSpecialFeature ? true : undefined,
					hasThemeSong: filters.hasThemeSong ? true : undefined,
					hasThemeVideo: filters.hasThemeVideo ? true : undefined,
					videoTypes: videoTypes,
					isHd: filters.isSD ? true : filters.isHD || undefined,
					is4K: filters.is4K || undefined,
					is3D: filters.is3D || undefined,
					enableUserData: true,
				});
			} else {
				const videoTypes: VideoType[] = [];
				if (videoTypesState.BluRay) videoTypes.push(VideoType.BluRay);
				if (videoTypesState.Dvd) videoTypes.push(VideoType.Dvd);
				if (videoTypesState.Iso) videoTypes.push(VideoType.Iso);
				if (videoTypesState.VideoFile) videoTypes.push(VideoType.VideoFile);

				const filtersArray: ItemFilter[] = [];
				if (filters.isPlayed) filtersArray.push(ItemFilter.IsPlayed);
				if (filters.isUnPlayed) filtersArray.push(ItemFilter.IsUnplayed);
				if (filters.isResumable) filtersArray.push(ItemFilter.IsResumable);
				if (filters.isFavorite) filtersArray.push(ItemFilter.IsFavorite);

				result = await getItemsApi(api).getItems({
					userId: user.data?.Id,
					parentId: currentLib.data?.Id,
					recursive:
						currentLib.data?.CollectionType === "boxsets" ? undefined : true,
					includeItemTypes: [currentViewType],
					sortOrder: [
						sortAscending ? SortOrder.Ascending : SortOrder.Descending,
					],
					sortBy: [sortBy],
					filters: filtersArray,
					hasSubtitles: filters.hasSubtitles ? true : undefined,
					hasTrailer: filters.hasTrailer ? true : undefined,
					hasSpecialFeature: filters.hasSpecialFeature ? true : undefined,
					hasThemeSong: filters.hasThemeSong ? true : undefined,
					hasThemeVideo: filters.hasThemeVideo ? true : undefined,
					videoTypes: videoTypes,
					isHd: filters.isSD ? true : filters.isHD || undefined,
					is4K: filters.is4K || undefined,
					is3D: filters.is3D || undefined,
					enableUserData: true,
				});
			}
			return result.data;
		},
		// enabled: false,
		enabled: user.isSuccess && Boolean(currentViewType) && currentLib.isSuccess,
		networkMode: "always",
		// gcTime: 0,
	});

	const cardSize = useMemo(
		() =>
			items.data?.Items?.[0]?.Type === BaseItemKind.MusicAlbum ||
			items.data?.Items?.[0]?.Type === BaseItemKind.Audio ||
			items.data?.Items?.[0]?.Type === BaseItemKind.Genre ||
			items.data?.Items?.[0]?.Type === BaseItemKind.MusicGenre ||
			items.data?.Items?.[0]?.Type === BaseItemKind.Studio ||
			items.data?.Items?.[0]?.Type === BaseItemKind.Playlist
				? 260
				: 356,
		[items.dataUpdatedAt],
	); // This sets the approx height of each card in libraryView to estimate no of virtual rows to render
	const windowWidth = useWindowWidth();
	const itemsPerRow = useMemo(
		() => Math.max(1, Math.floor(windowWidth / 200)),
		[windowWidth],
	);
	const count = useMemo(
		() =>
			(items.data?.TotalRecordCount ?? 1) > itemsPerRow
				? Math.ceil((items.data?.TotalRecordCount ?? 1) / itemsPerRow)
				: 1,
		[itemsPerRow, items.dataUpdatedAt],
	);
	const virtualizer = useWindowVirtualizer({
		count,
		estimateSize: () => cardSize,
		overscan: 7,
	});

	const disabledSortViews = [
		"MusicArtist",
		"Person",
		"Genre",
		"MusicGenre",
		"Studio",
	];
	const allowedFilterViews: allowedFilters = [
		CollectionType.Movies,
		CollectionType.Tvshows,
		CollectionType.Music,
		CollectionType.Books,
	];
	const onlyStatusFilterViews = ["books", "music"];

	const [filterButtonAnchorEl, setFilterButtonAnchorEl] =
		useState<HTMLButtonElement | null>(null);
	const filterMenuOpen = useMemo(
		() => Boolean(filterButtonAnchorEl),
		[filterButtonAnchorEl],
	);
	const handleFilterDropdown = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			setFilterButtonAnchorEl(e.currentTarget);
		},
		[currentViewType, filterButtonAnchorEl],
	);

	const scrollTrigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 20,
	});

	const [backdropItems, setBackdropItems] = useState<BaseItemDto[] | undefined>(
		[],
	);
	useEffect(() => {
		// Filter all items having backdrop images for library backdrop
		if (items.isSuccess) {
			const backdropItemsTemp = items.data.Items?.filter(
				(item) => item.BackdropImageTags?.length,
			);
			const backdropItem = backdropItemsTemp?.[0];
			// enqueueSnackbar("Running");
			setBackdrop(
				api?.getItemImageUrl(backdropItem?.Id ?? "", "Backdrop", {
					tag: backdropItem?.BackdropImageTags?.[0],
				}),
				backdropItem?.BackdropImageTags?.[0] ?? "none",
			);
			setBackdropItems(backdropItemsTemp);
		}
	}, [items.isSuccess]);

	useEffect(() => {
		if (backdropItems?.length) {
			const intervalId = setInterval(() => {
				const itemIndex = Math.floor(Math.random() * backdropItems?.length);
				const backdropItem = backdropItems[itemIndex];
				// enqueueSnackbar("Running");
				setBackdrop(
					api?.getItemImageUrl(backdropItem.Id ?? "", "Backdrop", {
						tag: backdropItem.BackdropImageTags?.[0],
					}),
					backdropItem.BackdropImageTags?.[0] ?? "none",
				);
			}, 14000); // Update backdrop every 14s
			return () => clearInterval(intervalId);
		}
	}, [backdropItems]);

	if (items.isError) {
		console.error(items.error);
	}
	if (currentLib.isPending) {
		return (
			<div
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			>
				<CircularProgress size={72} thickness={1.4} />
			</div>
		);
	}
	if (currentLib.isSuccess) {
		return (
			<main className="scrollY library padded-top">
				<div
					style={{
						padding: "1em 1em 1em 0.6em",
						height: "4.4em",
						zIndex: "10",
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-start",
						position: "absolute",
						top: "0px",
						left: "50%",
						transform: "translate(-50%)",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							width: "fit-content",
							padding: "0 1em",
						}}
					>
						<Typography variant="h5" sx={{ mr: 2, flexShrink: 0 }} noWrap>
							{currentLib.isPending ? (
								<CircularProgress sx={{ p: 1 }} />
							) : (
								currentLib.data.Name
							)}
						</Typography>
						<Chip
							label={
								!items.isSuccess ? (
									<CircularProgress sx={{ p: 1.5 }} />
								) : (
									items.data.TotalRecordCount
								)
							}
						/>
					</div>
				</div>
				<div className="library-items">
					{currentLib.isSuccess && (
						<div
							className={
								scrollTrigger
									? "library-items-header glass scrolling"
									: "library-items-header"
							}
							// padding={2}
						>
							<Stack
								divider={<Divider flexItem orientation="vertical" />}
								direction="row"
								alignItems="center"
								justifyContent="center"
								gap={1.2}
								className="library-items-options"
							>
								{!disableSort && (
									<div className="flex flex-row flex-center">
										<IconButton
											onClick={() => setSortAscending((state) => !state)}
										>
											<span
												className="material-symbols-rounded"
												style={{
													transform: sortAscending
														? "rotateX(0deg)"
														: "rotateX(180deg)",
												}}
											>
												sort
											</span>
										</IconButton>
										<TextField
											select
											value={sortBy}
											size="small"
											onChange={(e: ChangeEvent<HTMLSelectElement>) =>
												setSortBy(e.target.value)
											}
										>
											{sortByOptions.map((item) => (
												<MenuItem key={item.value} value={item.value}>
													{item.title}
												</MenuItem>
											))}
										</TextField>
									</div>
								)}
								{availableViewTypes.length > 0 && (
									<TextField
										select
										value={currentViewType}
										size="small"
										onChange={(e: ChangeEvent<HTMLSelectElement>) =>
											setCurrentViewType(e.target.value)
										}
									>
										{availableViewTypes.map((item) => (
											<MenuItem key={item.value} value={item.value}>
												{item.title}
											</MenuItem>
										))}
									</TextField>
								)}
								<>
									<Button
										startIcon={
											<span className="material-symbols-rounded">
												filter_list
											</span>
										}
										size="large"
										color="white"
										onClick={handleFilterDropdown}
									>
										Filter
									</Button>
									<Menu
										open={filterMenuOpen}
										anchorEl={filterButtonAnchorEl}
										onClose={() => setFilterButtonAnchorEl(null)}
										slotProps={{
											paper: {
												style: {
													width: "28em",
													maxHeight: "32em",
												},
											},
										}}
									>
										<Typography
											variant="h6"
											fontWeight={600}
											mx="0.4em"
											mb={0.5}
										>
											Filters
										</Typography>
										<FormControl
											style={{
												background: "rgb(0 0 0 / 0.4)",
												width: "100%",
												padding: "0.4em 1em",
												borderRadius: "6px",
											}}
										>
											<FormControlLabel
												control={<Checkbox checked={filters.isPlayed} />}
												label="Played"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														isPlayed: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={filters.isUnPlayed} />}
												label="Unplayed"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														isUnPlayed: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={filters.isResumable} />}
												label="Resumable"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														isResumable: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={filters.isFavorite} />}
												label="Favorites"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														isFavorite: e.target.checked,
													}))
												}
											/>
										</FormControl>
										<Typography
											variant="h6"
											fontWeight={600}
											mx="0.4em"
											mb={0.5}
										>
											Features
										</Typography>
										<FormControl
											style={{
												background: "rgb(0 0 0 / 0.4)",
												width: "100%",
												padding: "0.4em 1em",
												borderRadius: "6px",
											}}
										>
											<FormControlLabel
												control={<Checkbox checked={filters.hasSubtitles} />}
												label="Subtitles"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														hasSubtitles: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={filters.hasTrailer} />}
												label="Trailer"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														hasTrailer: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={
													<Checkbox checked={filters.hasSpecialFeature} />
												}
												label="Special Features"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														hasSpecialFeature: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={filters.hasThemeSong} />}
												label="Theme Song"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														hasThemeSong: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={filters.hasThemeVideo} />}
												label="Theme Video"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														hasThemeVideo: e.target.checked,
													}))
												}
											/>
										</FormControl>
										<Typography
											variant="h6"
											fontWeight={600}
											mx="0.4em"
											mb={0.5}
										>
											Video Types
										</Typography>
										<FormControl
											style={{
												background: "rgb(0 0 0 / 0.4)",
												width: "100%",
												padding: "0.4em 1em",
												borderRadius: "6px",
											}}
										>
											<FormControlLabel
												control={<Checkbox checked={videoTypesState.BluRay} />}
												label="BluRay"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setVideoTypesState((s) => ({
														...s,
														BluRay: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={videoTypesState.Dvd} />}
												label="DVD"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setVideoTypesState((s) => ({
														...s,
														Dvd: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={filters.isHD} />}
												label="HD"
												onChange={(e: ChangeEvent<HTMLInputElement>) => {
													setFilters((s) => ({
														...s,
														isHD: e.target.checked,
													}));
												}}
											/>
											<FormControlLabel
												control={<Checkbox checked={filters.is4K} />}
												label="4k"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														is4K: e.target.checked,
													}))
												}
											/>
											<FormControlLabel
												control={<Checkbox checked={false} />}
												label="SD"
												disabled
											/>
											<FormControlLabel
												control={<Checkbox value={filters.is3D} />}
												label="3D"
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													setFilters((s) => ({
														...s,
														is3D: e.target.checked,
													}))
												}
											/>
										</FormControl>
									</Menu>
								</>
							</Stack>
						</div>
					)}
					{items.isPending ? (
						<LibraryItemsSkeleton />
					) : items.data?.TotalRecordCount === 0 ? (
						<EmptyNotice
							extraMsg={
								currentViewType === BaseItemKind.Trailer &&
								"Install the trailers channel to enhance your movie experience by adding a library of internet trailers."
							}
						/>
					) : currentViewType === BaseItemKind.Genre ? (
						items.data?.Items?.map((item) => {
							return (
								<GenreView
									key={item.Id}
									libraryId={currentLib.data.Id}
									genreId={item.Id}
									genreName={item.Name}
									userId={user.data?.Id}
								/>
							);
						})
					) : currentViewType !== BaseItemKind.Audio ? (
						<div
							style={{
								height: virtualizer.getTotalSize(),
								width: "100%",
								position: "relative",
							}}
						>
							{virtualizer.getVirtualItems().map((virtualRow) => {
								const index = virtualRow.index;
								const displayItems = [];
								const fromIndex = index * itemsPerRow;
								const toIndex = Math.min(
									fromIndex + itemsPerRow,
									items.data?.TotalRecordCount,
								);
								for (let i = fromIndex; i < toIndex; i++) {
									const item = items.data?.Items[i];
									displayItems.push(
										<div
											className="library-virtual-item"
											key={i}
											data-index={virtualRow.index}
											ref={virtualizer.measureElement}
										>
											<Card
												item={item}
												seriesId={item.SeriesId}
												cardTitle={
													item.Type === BaseItemKind.Episode
														? item.SeriesName
														: item.Name
												}
												imageType={"Primary"}
												cardCaption={
													item.Type === BaseItemKind.Episode
														? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
														: item.Type === BaseItemKind.Series
															? `${item.ProductionYear} - ${
																	item.EndDate
																		? new Date(item.EndDate).toLocaleString(
																				[],
																				{
																					year: "numeric",
																				},
																			)
																		: "Present"
																}`
															: item.ProductionYear
												}
												disableOverlay={
													item.Type === BaseItemKind.Person ||
													item.Type === BaseItemKind.Genre ||
													item.Type === BaseItemKind.MusicGenre ||
													item.Type === BaseItemKind.Studio
												}
												cardType={
													item.Type === BaseItemKind.MusicAlbum ||
													item.Type === BaseItemKind.Audio ||
													item.Type === BaseItemKind.Genre ||
													item.Type === BaseItemKind.MusicGenre ||
													item.Type === BaseItemKind.Studio ||
													item.Type === BaseItemKind.Playlist
														? "square"
														: "portrait"
												}
												// queryKey={items}
												userId={user.data.Id}
												imageBlurhash={
													!!item.ImageBlurHashes?.Primary &&
													item.ImageBlurHashes?.Primary[
														Object.keys(item.ImageBlurHashes.Primary)[0]
													]
												}
											/>
										</div>,
									);
								}
								return (
									<div
										className="library-virtual-item-row"
										key={virtualRow.key}
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											height: virtualRow.size,
											transform: `translateY(${virtualRow.start}px)`,
										}}
									>
										{displayItems}
									</div>
								);
							})}
						</div>
					) : (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
							}}
						>
							{items.data.Items.map((item) => (
								<MusicTrack
									item={item}
									key={item.Id}
									// queryKey={[
									// 	"libraryView",
									// 	"currentLibItems",
									// 	id,
									// 	{
									// 		currentViewType: currentViewType,
									// 		sortAscending: sortAscending,
									// 		sortBy: sortBy,
									// 		extraFilters: {
									// 			hasSubtitles: hasSubtitles,
									// 			hasTrailer: hasTrailer,
									// 			hasSpecialFeature: hasSpecialFeature,
									// 			hasThemeSong: hasThemeSong,
									// 			hasThemeVideo: hasThemeVideo,
									// 		},
									// 		qualityFilters: {
									// 			isBluRay: isBluRay,
									// 			isDVD: isDVD,
									// 			isHD: isHD,
									// 			is4K: is4K,
									// 			is3D: is3D,
									// 		},
									// 	},
									// ]}
									userId={user.data.Id}
								/>
							))}
						</div>
					)}
				</div>

				{items.isError && <ErrorNotice />}
			</main>
		);
	}
	if (currentLib.isError) {
		return <h6>{currentLib.error}</h6>;
	}
}

export default LibraryView;
	