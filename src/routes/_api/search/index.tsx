import React, { useEffect, useState } from "react";

import TextField from "@mui/material/TextField";

import { useBackdropStore } from "@/utils/store/backdrop";

import { useQuery } from "@tanstack/react-query";

import { EmptyNotice } from "@/components/notices/emptyNotice/emptyNotice";

import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";
import { getSearchApi } from "@jellyfin/sdk/lib/utils/api/search-api";
import "./search.scss";
import { useCentralStore } from "@/utils/store/central";
import { Fab } from "@mui/material";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_api/search/")({
	component: SearchPage,
	validateSearch: (search: Record<string, unknown>): { query: string } => {
		return { query: search.query as string };
	},
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
			if (!api) return null;
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
			if (!api) return null;
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
			if (!api) return null;
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
			if (!api) return null;
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
			if (!api) return null;
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
			if (!api) return null;
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
			if (!api) return null;
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
			if (!api) return null;
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
				{movies.isSuccess && Boolean(movies.data?.Items?.length) && (
					<CardScroller title="Movies" displayCards={7} disableDecoration>
						{movies.data?.Items?.map((item) => (
							<Card
								key={item.Id}
								item={item}
								cardTitle={item.Name}
								imageType={"Primary"}
								cardCaption={item.ProductionYear}
								cardType="portrait"
								queryKey={["search", "items", "Movie", query]}
								userId={user?.Id}
							/>
						))}
					</CardScroller>
				)}
				{series.isSuccess && Boolean(series.data?.Items?.length) && (
					<CardScroller title="TV Shows" displayCards={7} disableDecoration>
						{series.data?.Items?.map((item) => (
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
							/>
						))}
					</CardScroller>
				)}
				{episodes.isSuccess && Boolean(episodes.data?.TotalRecordCount) && (
					<CardScroller title="Episodes" displayCards={4} disableDecoration>
						{episodes.data?.SearchHints?.map((episode) => {
							return (
								<Card
									key={episode.Id}
									item={episode}
									cardTitle={episode.Series}
									cardType="thumb"
									cardCaption={`S${episode.ParentIndexNumber}:E${episode.IndexNumber} - ${episode.Name}`}
									queryKey={["search", "items", "Episodes", query]}
									userId={user?.Id}
								/>
							);
						})}
					</CardScroller>
				)}
				{audio.isSuccess && Boolean(audio.data?.Items?.length) && (
					<CardScroller title="Audio" displayCards={7} disableDecoration>
						{audio.data?.Items?.map((item) => (
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
				{musicAlbum.isSuccess && Boolean(musicAlbum.data?.Items?.length) && (
					<CardScroller title="Albums" displayCards={7} disableDecoration>
						{musicAlbum.data?.Items?.map((item) => (
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
				{book.isSuccess && Boolean(book.data?.Items?.length) && (
					<CardScroller title="Books" displayCards={7} disableDecoration>
						{book.data?.Items?.map((item) => (
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
				{musicArtists.isSuccess &&
					Boolean(musicArtists.data?.Items?.length) && (
						<CardScroller title="Artists" displayCards={7} disableDecoration>
							{musicArtists.data?.Items?.map((item) => (
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
				{person.isSuccess && Boolean(person.data?.Items?.length) && (
					<CardScroller title="People" displayCards={7} disableDecoration>
						{person.data?.Items?.map((item) => (
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
				movies.data?.Items?.length === 0 &&
				series.data?.Items?.length === 0 &&
				audio.data?.Items?.length === 0 &&
				musicAlbum.data?.Items?.length === 0 &&
				book.data?.Items?.length === 0 &&
				musicArtists.data?.Items?.length === 0 &&
				person.data?.Items?.length === 0 &&
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
