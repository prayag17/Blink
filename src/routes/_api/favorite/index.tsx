import React, { useEffect } from "react";

import { useBackdropStore } from "@/utils/store/backdrop";

import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import "./favorite.scss";

import { Card } from "@/components/card/card";
import { CardScroller } from "@/components/cardScroller/cardScroller";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_api/favorite/")({
	component: FavoritePage,
});

function FavoritePage() {
	const api = Route.useRouteContext().api;
	const [setBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
		enabled: Boolean(api),
	});

	const movies = useQuery({
		queryKey: ["favorite", "movies"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.Movie],
				recursive: true,
			});
			return result.data;
		},
	});

	const series = useQuery({
		queryKey: ["favorite", "series"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
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
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
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
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
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
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
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
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
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
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
				isFavorite: true,
				includeItemTypes: [BaseItemKind.Person],
				recursive: true,
			});
			return result.data;
		},
	});

	useEffect(() => {
		setBackdrop("", "");
	});

	return (
		<main
			className="scrollY"
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "0.5em",
				paddingBottom: "2em",
				paddingTop: "4.2em",
			}}
		>
			{movies.isSuccess && movies.data.Items.length > 0 && (
				<CardScroller displayCards={8} title="Movies">
					{movies.data.Items.map((item) => (
						<Card
							key={item.Id}
							item={item}
							cardTitle={item.Name}
							imageType={"Primary"}
							cardCaption={item.ProductionYear}
							cardType="portrait"
							queryKey={["favorite", "movies"]}
							userId={user.data.Id}
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
					{series.data.Items.map((item) => (
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
							queryKey={["favorite", "series"]}
							userId={user.data.Id}
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
			{audio.isSuccess && audio.data.Items.length > 0 && (
				<CardScroller title="Audio" displayCards={8} disableDecoration>
					{audio.data.Items.map((item) => (
						<Card
							key={item.Id}
							item={item}
							cardTitle={item.Name}
							imageType={"Primary"}
							cardCaption={item.ProductionYear}
							cardType="square"
							queryKey={["favorite", "audio"]}
							userId={user.data.Id}
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
			{musicAlbum.isSuccess && musicAlbum.data.Items.length > 0 && (
				<CardScroller title="Albums" displayCards={8} disableDecoration>
					{musicAlbum.data.Items.map((item) => (
						<Card
							key={item.Id}
							item={item}
							seriesId={item.SeriesId}
							cardTitle={item.Name}
							imageType={"Primary"}
							cardCaption={item.AlbumArtist}
							cardType={"square"}
							queryKey={["favorite", "musicAlbum"]}
							userId={user.data.Id}
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
			{book.isSuccess && book.data.Items.length > 0 && (
				<CardScroller title="Books" displayCards={8} disableDecoration>
					{book.data.Items.map((item) => (
						<Card
							key={item.Id}
							item={item}
							cardTitle={item.Name}
							imageType={"Primary"}
							cardCaption={item.ProductionYear}
							disableOverlay
							cardType={"portrait"}
							queryKey={["favorite", "book"]}
							userId={user.data.Id}
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
			{musicArtists.isSuccess && musicArtists.data.Items.length > 0 && (
				<CardScroller title="Artists" displayCards={8} disableDecoration>
					{musicArtists.data.Items.map((item) => (
						<Card
							key={item.Id}
							item={item}
							cardTitle={item.Name}
							imageType={"Primary"}
							disableOverlay
							cardType={"square"}
							queryKey={["favorite", "musicArtist"]}
							userId={user.data.Id}
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
			{person.isSuccess && person.data.Items.length > 0 && (
				<CardScroller title="People" displayCards={8} disableDecoration>
					{person.data.Items.map((item) => (
						<Card
							key={item.Id}
							item={item}
							cardTitle={item.Name}
							imageType={"Primary"}
							disableOverlay
							cardType={"square"}
							queryKey={["favorite", "person"]}
							userId={user.data.Id}
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
		</main>
	);
}

export default FavoritePage;
