import React, {
	useState,
	useEffect,
	type ChangeEvent,
	useMemo,
	useCallback,
	type MouseEvent,
} from "react";

import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/card/card";
import { EmptyNotice } from "@/components/notices/emptyNotice/emptyNotice";
import { getArtistsApi } from "@jellyfin/sdk/lib/utils/api/artists-api";
import { getGenresApi } from "@jellyfin/sdk/lib/utils/api/genres-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getMusicGenresApi } from "@jellyfin/sdk/lib/utils/api/music-genres-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";
import { getStudiosApi } from "@jellyfin/sdk/lib/utils/api/studios-api";

import MusicTrack from "@/components/musicTrack";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import { useBackdropStore } from "@/utils/store/backdrop";
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
import { FormControl, Menu, Stack, useScrollTrigger } from "@mui/material";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { AxiosResponse } from "axios";
import "./library.scss";
import LibraryItemsSkeleton from "@/components/skeleton/libraryItems";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { createFileRoute } from "@tanstack/react-router";

type SortByObject = { title: string; value: string };
type ViewObject = { title: string; value: BaseItemKind | "Artist" };
// type allowedFilters = ["movies", "tvshows", "music", "books"];

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
	component: Library,
});

function Library() {
	const api = useApiInContext((s) => s.api);

	const { id } = Route.useParams();

	const user = useCentralStore((s) => s.currentUser);

	const currentLib = useQuery({
		queryKey: ["library", "currentLib", id],
		queryFn: async () => {
			if (!api) return null;
			const result = await getUserLibraryApi(api).getItem({
				userId: user?.Id,
				itemId: id,
			});
			return result.data;
		},
		enabled: !!user?.Id,
		networkMode: "always",
		staleTime: 0,
	});

	const genres = useQuery({
		queryKey: ["library", "genreItem", id],
		queryFn: async () => {
			if (!api) return null;
			if (currentLib.data?.CollectionType === "music") {
				const result = await getMusicGenresApi(api).getMusicGenres({
					parentId: id,
					userId: user?.Id,
				});
				return result.data;
			}
			const result = await getGenresApi(api).getGenres({
				parentId: id,
				userId: user?.Id,
			});
			return result.data;
		},
	});

	const [genreFilter, setGenreFilter] = useState<string[]>(() => {
		const cachedVal = sessionStorage.getItem(
			`library-${currentLib.data?.Id}-config_genreFilter`,
		);
		if (cachedVal) {
			return JSON.parse(cachedVal);
		}
		return [];
	});
	const handleGenreFilter = useCallback(
		(e: ChangeEvent<HTMLInputElement>, genre: BaseItemDto) => {
			if (e.target.checked) {
				const genreFilterTemp = [...genreFilter, genre.Id];
				setGenreFilter((s) => (genre.Id ? [...s, genre.Id] : s));
				sessionStorage.setItem(
					`library-${currentLib.data?.Id}-config_genreFilter`,
					JSON.stringify(genreFilterTemp),
				);
			} else {
				const genreFilterTemp = genreFilter.filter((id) => id !== genre.Id);
				setGenreFilter((s) => s.filter((id) => id !== genre.Id));
				sessionStorage.setItem(
					`library-${currentLib.data?.Id}-config_genreFilter`,
					JSON.stringify(genreFilterTemp),
				);
			}
		},
		[genres.data?.Items?.length, id],
	);

	const [currentViewType, setCurrentViewType] = useState<
		BaseItemKind | "Artist"
	>(undefined!);
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
			case CollectionType.Music:
				result = [
					{
						title: "Albums",
						value: BaseItemKind.MusicAlbum,
					},
					{
						title: "Album Artist",
						value: BaseItemKind.MusicArtist,
					},
					{
						title: "Artist",
						value: "Artist",
					},
					{
						title: "Playlist",
						value: BaseItemKind.Playlist,
					},
					{
						title: "Songs",
						value: BaseItemKind.Audio,
					},
					{
						title: "Genre",
						value: BaseItemKind.Genre,
					},
				];
				break;
			case CollectionType.Playlists:
				result = [{ title: "Playlist", value: BaseItemKind.Playlist }];
				break;
			default:
				result = [];
		}
		if (
			sessionStorage.getItem(
				`library-${currentLib.data?.Id}-config_currentViewType`,
			)
		) {
			setCurrentViewType(
				sessionStorage.getItem(
					`library-${currentLib.data?.Id}-config_currentViewType`,
				) as BaseItemKind | "Artist",
			);
		} else {
			setCurrentViewType(result?.[0]?.value);
		}
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

	const [sortBy, setSortBy] = useState<string>("Name");
	const [sortAscending, setSortAscending] = useState(
		() =>
			JSON.parse(
				sessionStorage.getItem(
					`library-${currentLib.data?.Id}-config_sort`,
				) as string,
			)?.sortAscending ?? true,
	);
	useEffect(() => {
		// I don't know why this works, don't ask...
		const cachedVal = sessionStorage.getItem(
			`library-${currentLib.data?.Id}-config_sort`,
		) as unknown as {
			sortAscending?: boolean;
			sortBy?: ItemSortBy;
		};
		if (cachedVal?.sortAscending) {
			console.log(cachedVal.sortAscending);
			setSortAscending(cachedVal.sortAscending);
		}
	}, [currentLib.data?.Id]);
	const sortByOptions: SortByObject[] = useMemo(() => {
		let result: SortByObject[] = undefined!;
		switch (currentViewType) {
			case BaseItemKind.Audio:
				result = [
					{
						title: "Track Name",
						value: ItemSortBy.Name,
					},
					{
						title: "Album",
						value: ItemSortBy.Album,
					},
					{
						title: "Album Artist",
						value: ItemSortBy.AlbumArtist,
					},
					{
						title: "Artist",
						value: ItemSortBy.Artist,
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
						title: "Play Count",
						value: ItemSortBy.PlayCount,
					},
					{
						title: "Release Date",
						value: ItemSortBy.PremiereDate,
					},
					{
						title: "Runtime",
						value: ItemSortBy.Runtime,
					},
					{
						title: "Random",
						value: ItemSortBy.Random,
					},
				];
				break;
			case BaseItemKind.MusicAlbum:
				result = [
					{
						title: "Name",
						value: ItemSortBy.SortName,
					},
					{
						title: "Album Artist",
						value: ItemSortBy.AlbumArtist,
					},
					{
						title: "Community Rating",
						value: ItemSortBy.CommunityRating,
					},
					{
						title: "Critcs Rating",
						value: ItemSortBy.CriticRating,
					},
					{
						title: "Date Added",
						value: ItemSortBy.DateCreated,
					},
					{
						title: "Release Date",
						value: ItemSortBy.PremiereDate,
					},
					{
						title: "Random",
						value: ItemSortBy.Random,
					},
				];
				break;
			case BaseItemKind.Playlist:
				result = [
					{
						title: "Name",
						value: ItemSortBy.SortName,
					},
					{
						title: "Community Rating",
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
						title: "Folder",
						value: `${ItemSortBy.IsFolder},${ItemSortBy.SortName}`,
					},
					{ title: "Parenal Rating", value: ItemSortBy.OfficialRating },
					{
						title: "Play Count",
						value: ItemSortBy.PlayCount,
					},
					{
						title: "Release Date",
						value: `${ItemSortBy.ProductionYear},${ItemSortBy.PremiereDate},${ItemSortBy.SortName}`,
					},
					{
						title: "Random",
						value: ItemSortBy.Random,
					},
				];
				break;
			default:
				result = [];
				break;
		}
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
		}
		// And they say typescript makes your code better :|
		const cachedVal = JSON.parse(
			sessionStorage.getItem(
				`library-${currentLib.data?.Id}-config_sort`,
			) as string,
		);
		// as {
		// 	sortAscending: boolean;
		// 	sortBy: ItemSortBy;
		// }
		if (cachedVal) {
			setSortBy(cachedVal.sortBy);
		} else {
			setSortBy(result?.[0]?.value);
		}
		return result;
	}, [currentLib.data?.CollectionType, currentViewType]);

	const [filters, setFilters] = useState<Record<string, undefined | boolean>>(
		() => {
			const cachedVal = sessionStorage.getItem(
				`library-${currentLib.data?.Id}-config_fliters`,
			);
			if (cachedVal !== null) {
				return JSON.parse(cachedVal);
			}
			return {
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
			};
		},
	);
	useEffect(() => {
		sessionStorage.setItem(
			`library-${currentLib.data?.Id}-config_fliters`,
			JSON.stringify(filters),
		);
	}, [filters, currentLib.data?.Id]);

	const items = useQuery({
		queryKey: [
			"library",
			"currentLibItems",
			id,
			{
				currentViewType: currentViewType,
				sortAscending: sortAscending,
				sortBy: sortBy,
				filters,
				videoTypesState,
				genreFilter,
			},
		],
		queryFn: async () => {
			if (!api) return null;
			let result: AxiosResponse<BaseItemDtoQueryResult, any>;
			if (currentViewType === "MusicArtist") {
				result = await getArtistsApi(api).getAlbumArtists({
					userId: user?.Id,
					parentId: id,
				});
			} else if (currentViewType === "Artist") {
				result = await getArtistsApi(api).getArtists({
					userId: user?.Id,
					parentId: id,
				});
			} else if (currentViewType === "Person") {
				result = await getPersonsApi(api).getPersons({
					userId: user?.Id,
					personTypes: ["Actor"],
				});
			} else if (currentViewType === "Studio") {
				result = await getStudiosApi(api).getStudios({
					userId: user?.Id,
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
					userId: user?.Id,
					parentId: currentLib.data?.Id,
					recursive:
						currentLib.data?.CollectionType === "boxsets" ? undefined : true,
					// includeItemTypes: [currentViewType],
					sortOrder: [
						sortAscending ? SortOrder.Ascending : SortOrder.Descending,
					],
					sortBy: sortBy.split(",") as ItemSortBy[],
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
					genreIds: genreFilter,
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
					userId: user?.Id,
					parentId: currentLib.data?.Id,
					recursive:
						currentLib.data?.CollectionType === "boxsets" ? undefined : true,
					includeItemTypes: [currentViewType],
					sortOrder: [
						sortAscending ? SortOrder.Ascending : SortOrder.Descending,
					],
					sortBy: sortBy.split(",") as ItemSortBy[],
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
					genreIds: genreFilter,
				});
			}
			return result.data;
		},
		enabled: !!user?.Id && Boolean(currentViewType) && currentLib.isSuccess,
		networkMode: "always",
	});

	const disableSort = useMemo(() => {
		if (items.data?.TotalRecordCount === 0) {
			return true; // Hide sorting options if library is empty
		}
		switch (currentViewType) {
			case BaseItemKind.MusicArtist:
			case BaseItemKind.Person:
			case BaseItemKind.MusicGenre:
			case BaseItemKind.Genre:
			case "Artist":
				return true;
			default:
				return false;
		}
	}, [currentViewType, items.isSuccess]);
	const disableFilters = useMemo(() => {
		switch (currentViewType) {
			case BaseItemKind.Movie:
			case BaseItemKind.Audio:
			case BaseItemKind.Series:
			case BaseItemKind.BoxSet:
				return false;
			default:
				return true;
		}
	}, [currentViewType]);

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
	); // This sets the approx height of each card in library to estimate no of virtual rows to render
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
		overscan: 1,
	});

	const rowVirtualizer = useWindowVirtualizer({
		count: items.data?.TotalRecordCount ?? 1,
		estimateSize: () => 80,
		overscan: 4,
	});
	// const onlyStatusFilterViews = ["books", "music"];

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

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);

	const backdropItems = useMemo(() => {
		if (items.isSuccess) {
			const temp = items.data?.Items?.filter(
				(item) => item.BackdropImageTags?.length,
			);
			if (temp?.[0]?.Id && api) {
				setBackdrop(
					getImageUrlsApi(api).getItemImageUrlById(temp?.[0]?.Id, "Backdrop", {
						tag: temp?.[0]?.BackdropImageTags?.[0],
					}),
					temp?.[0]?.BackdropImageTags?.[0] ?? "none",
				);
			}
			return temp;
		}
	}, [items]);

	useEffect(() => {
		if (backdropItems?.length && api) {
			const intervalId = setInterval(() => {
				const itemIndex = Math.floor(Math.random() * backdropItems?.length);
				const backdropItem = backdropItems[itemIndex];
				// enqueueSnackbar("Running");
				setBackdrop(
					getImageUrlsApi(api).getItemImageUrlById(
						backdropItem.Id ?? "",
						"Backdrop",
						{
							tag: backdropItem.BackdropImageTags?.[0],
						},
					),
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
								currentLib.data?.Name
							)}
						</Typography>
						<Chip
							label={
								!items.isSuccess ? (
									<CircularProgress sx={{ p: 1.5 }} />
								) : (
									items.data?.TotalRecordCount
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
								{!disableSort && sortBy && (
									<div className="flex flex-row flex-center">
										<IconButton
											onClick={() => {
												sessionStorage.setItem(
													`library-${currentLib.data?.Id}-config_sort`,
													JSON.stringify({
														sortAscending: !sortAscending,
														sortBy,
													}),
												);
												setSortAscending((state: boolean) => !state);
											}}
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
											value={sortBy ?? "Name"}
											size="small"
											onChange={(e) => {
												setSortBy(e.target.value);
												console.info(e);
												sessionStorage.setItem(
													`library-${currentLib.data?.Id}-config_sort`,
													JSON.stringify({
														sortAscending,
														sortBy: e.target.value,
													}),
												);
											}}
										>
											{sortByOptions.map((item) => (
												<MenuItem key={item.title} value={item.value}>
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
										onChange={(e) => {
											setCurrentViewType(e.target.value as BaseItemKind);
											sessionStorage.setItem(
												`library-${currentLib.data?.Id}-config_currentViewType`,
												e.target.value,
											);
										}}
									>
										{availableViewTypes.map((item) => (
											<MenuItem key={item.value} value={item.value}>
												{item.title}
											</MenuItem>
										))}
									</TextField>
								)}
								{!disableFilters && (
									<div>
										<Button
											startIcon={
												<span className="material-symbols-rounded">
													filter_list
												</span>
											}
											size="large"
											//@ts-ignore
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
											{currentViewType !== "Audio" && (
												<div>
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
															control={
																<Checkbox
																	checked={filters.isPlayed}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			isPlayed: e.target.checked,
																		}))
																	}
																/>
															}
															label="Played"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.isUnPlayed}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			isUnPlayed: e.target.checked,
																		}))
																	}
																/>
															}
															label="Unplayed"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.isResumable}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			isResumable: e.target.checked,
																		}))
																	}
																/>
															}
															label="Resumable"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.isFavorite}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			isFavorite: e.target.checked,
																		}))
																	}
																/>
															}
															label="Favorites"
														/>
													</FormControl>
												</div>
											)}
											{currentViewType !== "Audio" && (
												<div>
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
															control={
																<Checkbox
																	checked={filters.hasSubtitles}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			hasSubtitles: e.target.checked,
																		}))
																	}
																/>
															}
															label="Subtitles"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.hasTrailer}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			hasTrailer: e.target.checked,
																		}))
																	}
																/>
															}
															label="Trailer"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.hasSpecialFeature}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			hasSpecialFeature: e.target.checked,
																		}))
																	}
																/>
															}
															label="Special Features"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.hasThemeSong}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			hasThemeSong: e.target.checked,
																		}))
																	}
																/>
															}
															label="Theme Song"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.hasThemeVideo}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			hasThemeVideo: e.target.checked,
																		}))
																	}
																/>
															}
															label="Theme Video"
														/>
													</FormControl>
												</div>
											)}
											{currentViewType !== "Audio" && (
												<div>
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
															control={
																<Checkbox
																	checked={videoTypesState.BluRay}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setVideoTypesState((s) => ({
																			...s,
																			BluRay: e.target.checked,
																		}))
																	}
																/>
															}
															label="BluRay"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={videoTypesState.Dvd}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setVideoTypesState((s) => ({
																			...s,
																			Dvd: e.target.checked,
																		}))
																	}
																/>
															}
															label="DVD"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.isHD}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) => {
																		setFilters((s) => ({
																			...s,
																			isHD: e.target.checked,
																		}));
																	}}
																/>
															}
															label="HD"
														/>
														<FormControlLabel
															control={
																<Checkbox
																	checked={filters.is4K}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		setFilters((s) => ({
																			...s,
																			is4K: e.target.checked,
																		}))
																	}
																/>
															}
															label="4k"
														/>
														<FormControlLabel
															control={<Checkbox checked={false} />}
															label="SD"
															disabled
														/>
														<FormControlLabel
															control={
																<Checkbox
																	value={filters.is3D}
																	onChange={(e) =>
																		setFilters((s) => ({
																			...s,
																			is3D: e.target.checked,
																		}))
																	}
																/>
															}
															label="3D"
														/>
													</FormControl>
												</div>
											)}
											{genres.isSuccess &&
												(genres.data?.TotalRecordCount ?? 0) > 0 && (
													<div>
														<Typography
															variant="h6"
															fontWeight={600}
															mx="0.4em"
															mb={0.5}
														>
															Genres
														</Typography>
														<FormControl
															style={{
																background: "rgb(0 0 0 / 0.4)",
																width: "100%",
																padding: "0.4em 1em",
																borderRadius: "6px",
															}}
														>
															{genres.data?.Items?.map(
																(genre) =>
																	genre.Id && (
																		<FormControlLabel
																			key={genre.Id}
																			control={
																				<Checkbox
																					checked={genreFilter.includes(
																						genre.Id,
																					)}
																					onChange={(e) =>
																						handleGenreFilter(e, genre)
																					}
																				/>
																			}
																			label={genre.Name}
																		/>
																	),
															)}
														</FormControl>
													</div>
												)}
										</Menu>
									</div>
								)}
							</Stack>
						</div>
					)}
					{items.isPending ? (
						<LibraryItemsSkeleton />
					) : items.data?.TotalRecordCount === 0 ? (
						<EmptyNotice
							extraMsg={
								currentViewType === BaseItemKind.Trailer
									? "Install the trailers channel to enhance your movie experience by adding a library of internet trailers."
									: undefined
							}
						/>
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
									items.data?.TotalRecordCount ?? 0,
								);
								for (let i = fromIndex; i < toIndex; i++) {
									const item = items.data?.Items?.[i];
									if (!item) return null;
									displayItems.push(
										<div
											className="library-virtual-item"
											key={i}
											data-index={virtualRow.index}
											ref={virtualizer.measureElement}
										>
											<Card
												item={item}
												seriesId={item?.SeriesId}
												cardTitle={
													item?.Type === BaseItemKind.Episode
														? item.SeriesName
														: item?.Name
												}
												imageType={"Primary"}
												cardCaption={
													item?.Type === BaseItemKind.Episode
														? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
														: item?.Type === BaseItemKind.Series
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
															: item?.ProductionYear
												}
												disableOverlay={
													item?.Type === BaseItemKind.Person ||
													item?.Type === BaseItemKind.Genre ||
													item?.Type === BaseItemKind.MusicGenre ||
													item?.Type === BaseItemKind.Studio
												}
												cardType={
													item?.Type === BaseItemKind.MusicAlbum ||
													item?.Type === BaseItemKind.Audio ||
													item?.Type === BaseItemKind.Genre ||
													item?.Type === BaseItemKind.MusicGenre ||
													item?.Type === BaseItemKind.Studio ||
													item?.Type === BaseItemKind.Playlist
														? "square"
														: "portrait"
												}
												// queryKey={items}
												userId={user?.Id}
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
								height: `${rowVirtualizer.getTotalSize()}px`,
								width: "100%",
								position: "relative",
							}}
						>
							{rowVirtualizer.getVirtualItems().map((virtualRow) => {
								const item = items.data?.Items?.[virtualRow.index];
								if (!item) return null;
								return (
									<div
										key={item?.Id}
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											height: `${virtualRow.size}px`,
											transform: `translateY(${virtualRow.start}px)`,
										}}
									>
										<MusicTrack
											item={item}
											queryKey={["library"]}
											userId={user?.Id}
										/>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{items.isError && <ErrorNotice />}
			</main>
		);
	}
	if (currentLib.isError) {
		return <ErrorNotice error={currentLib.error} />;
	}
}
