import React, { useEffect, useState } from "react";

import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import { useBackdropStore } from "@/utils/store/backdrop";

import { useQuery } from "@tanstack/react-query";

import { EmptyNotice } from "@/components/notices/emptyNotice/emptyNotice";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import useDebounce from "@/utils/hooks/useDebounce";

import { Card } from "@/components/card/card";
import { EpisodeCard } from "@/components/card/episodeCard";
import { CardScroller } from "@/components/cardScroller/cardScroller";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";
import { getSearchApi } from "@jellyfin/sdk/lib/utils/api/search-api";
import "./search.scss";
import { Dialog, Fab } from "@mui/material";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCentralStore } from "@/utils/store/central";

export const Route = createFileRoute("/_api/search/")({
	component: SearchPage,
});

function SearchPage() {
	const api = Route.useRouteContext().api;

	const navigate = useNavigate();
	const { query } = Route.useSearch();

	const [searchTerm, setSearchTerm] = useState("");
	// const searchParam = useDebounce(query, 500);

	const user = useCentralStore((s) => s.currentUser);

	const itemLimit = 12;

	const movies = useQuery({
		queryKey: ["search", "items", "Movie", query],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				searchTerm: query,
				includeItemTypes: [BaseItemKind.Movie],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: !!user?.Id,
	});
	const series = useQuery({
		queryKey: ["search", "items", "Series", query],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				searchTerm: query,
				includeItemTypes: [BaseItemKind.Series],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: !!user?.Id,
	});
	const musicAlbum = useQuery({
		queryKey: ["search", "items", "MusicAlbum", query],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				searchTerm: query,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: !!user?.Id,
	});
	const audio = useQuery({
		queryKey: ["search", "items", "Audio", query],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				searchTerm: query,
				includeItemTypes: [BaseItemKind.Audio],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: !!user?.Id,
	});
	const book = useQuery({
		queryKey: ["search", "items", "Book", query],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				searchTerm: query,
				includeItemTypes: [BaseItemKind.Book],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: !!user?.Id,
	});
	const musicArtists = useQuery({
		queryKey: ["search", "items", "MusicArtists", query],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				searchTerm: query,
				includeItemTypes: [BaseItemKind.MusicArtist],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: !!user?.Id,
	});
	const person = useQuery({
		queryKey: ["search", "items", "Person", query],
		queryFn: async () => {
			const result = await getPersonsApi(api).getPersons({
				userId: user?.Id,
				searchTerm: query,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: !!user?.Id,
	});
	const episodes = useQuery({
		queryKey: ["search", "items", "Episodes", query],
		queryFn: async () => {
			const result = await getSearchApi(api).getSearchHints({
				userId: user?.Id,
				searchTerm: query,
				limit: itemLimit,
				includeItemTypes: ["Episode"],
			});
			return result.data;
		},
		enabled: !!user?.Id,
	});

	const [setBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	useEffect(() => {
		// Removing app's backdrop
		setBackdrop("", "");
	}, []);
	return (
		<div
			className="scrollY"
			style={{
				paddingTop: "4.2em",
				display: "flex",
				flexDirection: "column",
				gap: "0.5em",
				paddingBottom: "2em",
			}}
		>
			<div className="search-header">
				<TextField
					variant="outlined"
					style={{
						width: "50%",
					}}
					placeholder="Search"
					hiddenLabel
					className="search-searchbar"
					slotProps={{
						input: {
							style: {
								border: "100px !important",
							},
							autoFocus: true,
						},
						htmlInput: {
							className: "search-searchbar-input",
						},
					}}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.currentTarget.value)}
				/>
				<Fab
					size="medium"
					onClick={() =>
						navigate({ search: { query: searchTerm }, replace: true })
					}
				>
					<span className="material-symbols-rounded">search</span>
				</Fab>
			</div>
			<div
				style={{
					height: "100%",
				}}
			>
				{movies.isSuccess && movies.data.Items.length > 0 && (
					<CardScroller title="Movies" displayCards={8} disableDecoration>
						{movies.data.Items.map((item) => (
							<Card
								key={item.Id}
								item={item}
								cardTitle={item.Name}
								imageType={"Primary"}
								cardCaption={item.ProductionYear}
								cardType="portrait"
								queryKey={["search", "items", "Movie", query]}
								userId={user?.Id}
								imageBlurhash={
									!!item.ImageBlurHashes?.Primary &&
									item.ImageBlurHashes?.Primary[
										Object.keys(item.ImageBlurHashes.Primary)[0]
									]
								}
							/>
						))}
					</CardScroller>
				)}
				{series.isSuccess && series.data.Items.length > 0 && (
					<CardScroller title="TV Shows" displayCards={8} disableDecoration>
						{series.data.Items.map((item, index) => (
							<Card
								key={item.Id}
								item={item}
								cardTitle={item.Name}
								imageType={"Primary"}
								cardCaption={`${item.ProductionYear} - ${
									item.EndDate
										? new Date(item.EndDate).toLocaleString([], {
												year: "numeric",
											})
										: "Present"
								}`}
								cardType="portrait"
								queryKey={["search", "items", "Series", query]}
								userId={user?.Id}
								imageBlurhash={
									!!item.ImageBlurHashes?.Primary &&
									item.ImageBlurHashes?.Primary[
										Object.keys(item.ImageBlurHashes.Primary)[0]
									]
								}
							/>
						))}
					</CardScroller>
				)}
				{episodes.isSuccess && episodes.data.TotalRecordCount > 0 && (
					<CardScroller title="Episodes" displayCards={4} disableDecoration>
						{episodes.data.SearchHints?.map((episode) => {
							return (
								<EpisodeCard
									key={episode.Id}
									item={episode}
									cardTitle={episode.Series}
									cardCaption={`S${episode.ParentIndexNumber}:E${episode.IndexNumber} - ${episode.Name}`}
									queryKey={["search", "items", "Episodes", query]}
									userId={user?.Id}
									disableRunTime
								/>
							);
						})}
					</CardScroller>
				)}
				{audio.isSuccess && audio.data.Items?.length > 0 && (
					<CardScroller title="Audio" displayCards={8} disableDecoration>
						{audio.data.Items?.map((item, index) => (
							<Card
								key={item.Id}
								item={item}
								cardTitle={item.Name}
								imageType={"Primary"}
								cardCaption={item.ProductionYear}
								cardType="square"
								queryKey={["search", "items", "Audio", query]}
								userId={user?.Id}
							/>
						))}
					</CardScroller>
				)}
				{musicAlbum.isSuccess && musicAlbum.data.Items?.length > 0 && (
					<CardScroller title="Albums" displayCards={8} disableDecoration>
						{musicAlbum.data.Items?.map((item, index) => (
							<Card
								key={item.Id}
								item={item}
								seriesId={item.SeriesId}
								cardTitle={item.Name}
								imageType={"Primary"}
								cardCaption={item.AlbumArtist}
								cardType={"square"}
								queryKey={["search", "items", "MusicAlbum", query]}
								userId={user?.Id}
							/>
						))}
					</CardScroller>
				)}
				{book.isSuccess && book.data.Items?.length > 0 && (
					<CardScroller title="Books" displayCards={8} disableDecoration>
						{book.data.Items?.map((item, index) => (
							<Card
								key={item.Id}
								item={item}
								cardTitle={item.Name}
								imageType={"Primary"}
								cardCaption={item.ProductionYear}
								disableOverlay
								cardType={"portrait"}
								queryKey={["search", "items", "Book", query]}
								userId={user?.Id}
							/>
						))}
					</CardScroller>
				)}
				{musicArtists.isSuccess && musicArtists.data.Items?.length > 0 && (
					<CardScroller title="Artists" displayCards={8} disableDecoration>
						{musicArtists.data.Items?.map((item) => (
							<Card
								key={item.Id}
								item={item}
								cardTitle={item.Name}
								imageType={"Primary"}
								disableOverlay
								cardType={"square"}
								queryKey={["search", "items", "MusicArtists", query]}
								userId={user?.Id}
							/>
						))}
					</CardScroller>
				)}
				{person.isSuccess && person.data.Items?.length > 0 && (
					<CardScroller title="People" displayCards={8} disableDecoration>
						{person.data.Items?.map((item) => (
							<Card
								key={item.Id}
								item={item}
								cardTitle={item.Name}
								imageType={"Primary"}
								disableOverlay
								cardType={"square"}
								queryKey={["search", "items", "Person", query]}
								userId={user?.Id}
							/>
						))}
					</CardScroller>
				)}
			</div>

			{movies.isSuccess &&
				series.isSuccess &&
				audio.isSuccess &&
				musicAlbum.isSuccess &&
				book.isSuccess &&
				musicArtists.isSuccess &&
				person.isSuccess &&
				movies.data.Items?.length === 0 &&
				series.data.Items?.length === 0 &&
				audio.data.Items?.length === 0 &&
				musicAlbum.data.Items?.length === 0 &&
				book.data.Items?.length === 0 &&
				musicArtists.data.Items?.length === 0 &&
				person.data.Items?.length === 0 &&
				episodes.data?.SearchHints?.length === 0 && (
					<div
						style={{
							height: "calc(100vh - 12em)",
						}}
					>
						<EmptyNotice extraMsg={"Try using different search terms."} />
					</div>
				)}
			<Outlet />
		</div>
	);
}

export default SearchPage;
