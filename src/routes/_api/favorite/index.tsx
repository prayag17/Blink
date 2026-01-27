import { useQuery } from "@tanstack/react-query";
import React, { type SyntheticEvent, useEffect, useState } from "react";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./favorite.scss";

import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { Fade, Tab, Tabs, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import { useCentralStore } from "@/utils/store/central";

export const Route = createFileRoute("/_api/favorite/")({
	component: FavoritePage,
});

function FavoritePage() {
	const api = Route.useRouteContext().api;
	const [setBackdrop] = useBackdropStore(
		useShallow((state) => [state.setBackdrop]),
	);
	const [tabValue, setTabValue] = useState("overview");

	const user = useCentralStore((s) => s.currentUser);

	const movies = useQuery({
		queryKey: ["favorite", "movies"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.Movie],
				enableImages: true,
				recursive: true,
			});
			return result.data;
		},
	});

	const series = useQuery({
		queryKey: ["favorite", "series"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.Series],
				recursive: true,
			});
			return result.data;
		},
	});

	const musicAlbum = useQuery({
		queryKey: ["favorite", "musicAlbum"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				recursive: true,
			});
			return result.data;
		},
	});

	const audio = useQuery({
		queryKey: ["favorite", "audio"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.Audio],
				recursive: true,
			});
			return result.data;
		},
	});

	const book = useQuery({
		queryKey: ["favorite", "book"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.Book],
				recursive: true,
			});
			return result.data;
		},
	});

	const musicArtists = useQuery({
		queryKey: ["favorite", "musicArtist"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.MusicArtist],
				recursive: true,
			});
			return result.data;
		},
	});

	const person = useQuery({
		queryKey: ["favorite", "person"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.Person],
				recursive: true,
			});
			return result.data;
		},
	});

	useEffect(() => {
		// Set a backdrop from one of the favorites if available?
		// For now, clear it or maybe pick random from movies
		if (movies.data?.Items && movies.data.Items.length > 0) {
			const randomMovie =
				movies.data.Items[Math.floor(Math.random() * movies.data.Items.length)];
			if (randomMovie.BackdropImageTags?.[0]) {
				setBackdrop(
					randomMovie.ImageBlurHashes?.Backdrop?.[
						randomMovie.BackdropImageTags[0]
					] || "",
				);
			}
		} else {
			setBackdrop("");
		}
	}, [movies.data, setBackdrop]);

	const handleTabChange = (_event: SyntheticEvent, newValue: string) => {
		setTabValue(newValue);
	};

	const sections = [
		{
			id: "movies",
			title: "Movies",
			query: movies,
			renderCard: (item: BaseItemDto) => (
				<Card
					key={item.Id}
					item={item}
					cardTitle={item.Name}
					imageType={"Primary"}
					cardCaption={item.ProductionYear}
					cardType="portrait"
					queryKey={["favorite", "movies"]}
					userId={user?.Id}
				/>
			),
		},
		{
			id: "series",
			title: "TV Shows",
			query: series,
			renderCard: (item: BaseItemDto) => (
				<Card
					key={item.Id}
					item={item}
					cardTitle={item.Name}
					imageType={"Primary"}
					cardCaption={`${item.ProductionYear} - ${item.EndDate ? new Date(item.EndDate).getFullYear() : "Present"}`}
					cardType="portrait"
					queryKey={["favorite", "series"]}
					userId={user?.Id}
				/>
			),
		},
		{
			id: "albums",
			title: "Albums",
			query: musicAlbum,
			renderCard: (item: BaseItemDto) => (
				<Card
					key={item.Id}
					item={item}
					seriesId={item.SeriesId}
					cardTitle={item.Name}
					imageType={"Primary"}
					cardCaption={item.AlbumArtist}
					cardType={"square"}
					queryKey={["favorite", "musicAlbum"]}
					userId={user?.Id}
				/>
			),
		},
		{
			id: "artists",
			title: "Artists",
			query: musicArtists,
			renderCard: (item: BaseItemDto) => (
				<Card
					key={item.Id}
					item={item}
					cardTitle={item.Name}
					imageType={"Primary"}
					disableOverlay
					cardType={"square"}
					queryKey={["favorite", "musicArtist"]}
					userId={user?.Id}
				/>
			),
		},
		{
			id: "audio",
			title: "Songs",
			query: audio,
			renderCard: (item: BaseItemDto) => (
				<Card
					key={item.Id}
					item={item}
					cardTitle={item.Name}
					imageType={"Primary"}
					cardCaption={item.ProductionYear}
					cardType="square"
					queryKey={["favorite", "audio"]}
					userId={user?.Id}
				/>
			),
		},
		{
			id: "books",
			title: "Books",
			query: book,
			renderCard: (item: BaseItemDto) => (
				<Card
					key={item.Id}
					item={item}
					cardTitle={item.Name}
					imageType={"Primary"}
					cardCaption={item.ProductionYear}
					disableOverlay
					cardType={"portrait"}
					queryKey={["favorite", "book"]}
					userId={user?.Id}
				/>
			),
		},
		{
			id: "person",
			title: "People",
			query: person,
			renderCard: (item: BaseItemDto) => (
				<Card
					key={item.Id}
					item={item}
					cardTitle={item.Name}
					imageType={"Primary"}
					disableOverlay
					cardType={"square"}
					queryKey={["favorite", "person"]}
					userId={user?.Id}
				/>
			),
		},
	];

	const availableSections = sections.filter(
		(s) => s.query.isSuccess && (s.query.data?.Items?.length ?? 0) > 0,
	);

	return (
		<div className="favorite-page scrollY">
			<div className="favorite-header">
				<div className="header-content">
					<Typography variant="h1" component="h1">
						Your Favorites
					</Typography>
				</div>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					variant="scrollable"
					scrollButtons="auto"
					aria-label="favorite sections"
				>
					<Tab label="Overview" value="overview" />
					{availableSections.map((section) => (
						<Tab key={section.id} label={section.title} value={section.id} />
					))}
				</Tabs>
			</div>

			<div className="favorite-content">
				{tabValue === "overview" && (
					<Fade in={tabValue === "overview"}>
						<div className="overview-section">
							{availableSections.map((section) => (
								<CardScroller
									key={section.id}
									title={section.title}
									displayCards={7}
									disableDecoration
								>
									{section.query.data?.Items?.map(section.renderCard)}
								</CardScroller>
							))}
							{availableSections.length === 0 && (
								<div className="empty-state">
									<Typography variant="h5">No favorites yet</Typography>
									<Typography variant="body1">
										Mark items as favorite to see them here.
									</Typography>
								</div>
							)}
						</div>
					</Fade>
				)}

				{availableSections.map(
					(section) =>
						tabValue === section.id && (
							<Fade key={section.id} in={tabValue === section.id}>
								<div
									className={`grid-section ${["movies", "series", "books"].includes(section.id) ? "grid-landscape" : ""}`}
								>
									{section.query.data?.Items?.map(section.renderCard)}
								</div>
							</Fade>
						),
				)}
			</div>
		</div>
	);
}

export default FavoritePage;
