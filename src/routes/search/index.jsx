/** @format */
import { useEffect, useState } from "react";

import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";

import { useBackdropStore } from "../../utils/store/backdrop";

import { MdiMagnify } from "../../components/icons/mdiMagnify";

import { useQuery } from "@tanstack/react-query";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getSearchApi } from "@jellyfin/sdk/lib/utils/api/search-api";

import useDebounce from "../../utils/hooks/useDebounce";

import "./search.module.scss";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { CardScroller } from "../../components/cardScroller/cardScroller";
import { Card } from "../../components/card/card";

const SearchPage = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const searchParam = useDebounce(searchTerm, 500);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const itemLimit = 12;

	const movies = useQuery({
		queryKey: ["search", "items", "Movie", searchParam],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItemsByUserId({
				userId: user.data.Id,
				searchTerm,
				includeItemTypes: [BaseItemKind.Movie],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: user.isSuccess && Boolean(searchParam),
		cacheTime: 0,
	});
	const series = useQuery({
		queryKey: ["search", "items", "Series", searchParam],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItemsByUserId({
				userId: user.data.Id,
				searchTerm,
				includeItemTypes: [BaseItemKind.Series],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: user.isSuccess && Boolean(searchParam),
		cacheTime: 0,
	});
	const musicAlbum = useQuery({
		queryKey: ["search", "items", "MusicAlbum", searchParam],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItemsByUserId({
				userId: user.data.Id,
				searchTerm,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: user.isSuccess && Boolean(searchParam),
		cacheTime: 0,
	});
	const audio = useQuery({
		queryKey: ["search", "items", "Audio", searchParam],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItemsByUserId({
				userId: user.data.Id,
				searchTerm,
				includeItemTypes: [BaseItemKind.Audio],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: user.isSuccess && Boolean(searchParam),
		cacheTime: 0,
	});
	const book = useQuery({
		queryKey: ["search", "items", "Book", searchParam],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItemsByUserId({
				userId: user.data.Id,
				searchTerm,
				includeItemTypes: [BaseItemKind.Book],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: user.isSuccess && Boolean(searchParam),
		cacheTime: 0,
	});
	const musicArtists = useQuery({
		queryKey: ["search", "items", "MusicArtist", searchParam],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItemsByUserId({
				userId: user.data.Id,
				searchTerm,
				includeItemTypes: [BaseItemKind.MusicArtist],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: user.isSuccess && Boolean(searchParam),
		cacheTime: 0,
	});
	const person = useQuery({
		queryKey: ["search", "items", "Person", searchParam],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItemsByUserId({
				userId: user.data.Id,
				searchTerm,
				includeItemTypes: [BaseItemKind.Person],
				recursive: true,
				limit: itemLimit,
			});
			return result.data;
		},
		enabled: user.isSuccess && Boolean(searchParam),
		cacheTime: 0,
	});

	/**
	 * @typedef {import("@jellyfin/sdk/lib/generated-client/models").BaseItemDto} BaseItemDto
	 * @type {[BaseItemDto[], Function]}
	 */
	// const [movies, setMovies] = useState([]);
	// const [series, setSeries] = useState([]);
	// const [audios, setAudios] = useState([]);
	// const [musicAlbum, setMusicAlbum] = useState([]);
	// const [books, setBooks] = useState([]);
	// const [musicArtists, setMusicArtists] = useState([]);
	// const [persons, setPersons] = useState([]);

	// useEffect(() => {
	// 	if (items.isSuccess) {
	// 		setMovies(
	// 			items.data.Items.filter(
	// 				(item) => item.Type == BaseItemKind.Movie,
	// 			).slice(0, itemLimit),
	// 		);
	// 		setSeries(
	// 			items.data.Items.filter(
	// 				(item) => item.Type == BaseItemKind.Series,
	// 			).slice(0, itemLimit),
	// 		);
	// 		setAudios(
	// 			items.data.Items.filter(
	// 				(item) => item.Type == BaseItemKind.Audio,
	// 			).slice(0, itemLimit),
	// 		);
	// 		setMusicAlbum(
	// 			items.data.Items.filter(
	// 				(item) => item.Type == BaseItemKind.MusicAlbum,
	// 			).slice(0, itemLimit),
	// 		);
	// 		setBooks(
	// 			items.data.Items.filter(
	// 				(item) => item.Type == BaseItemKind.Book,
	// 			).slice(0, itemLimit),
	// 		);
	// 		setMusicArtists(
	// 			items.data.Items.filter(
	// 				(item) => item.Type == BaseItemKind.MusicArtist,
	// 			).slice(0, itemLimit),
	// 		);
	// 		setPersons(
	// 			items.data.Items.filter(
	// 				(item) => item.Type == BaseItemKind.Person,
	// 			).slice(0, itemLimit),
	// 		);
	// 	}
	// }, [items.isSuccess]);

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
					inputProps={{
						className: "search-searchbar-input",
					}}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>
			<div
				style={{
					height: "100%",
				}}
			>
				{movies.isSuccess && movies.data.Items.length > 0 && (
					<CardScroller
						title="Movies"
						displayCards={8}
						disableDecoration
					>
						{movies.data.Items.map((item, index) => (
							<Card
								item={item}
								seriesId={item.SeriesId}
								cardTitle={
									item.Type == BaseItemKind.Episode
										? item.SeriesName
										: item.Name
								}
								imageType={"Primary"}
								cardCaption={
									item.Type == BaseItemKind.Episode
										? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
										: item.Type ==
										  BaseItemKind.Series
										? `${item.ProductionYear} - ${
												!!item.EndDate
													? new Date(
															item.EndDate,
													  ).toLocaleString(
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
									item.Type == BaseItemKind.Person ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio
								}
								cardType={
									item.Type ==
										BaseItemKind.MusicAlbum ||
									item.Type == BaseItemKind.Audio ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio ||
									item.Type == BaseItemKind.Playlist
										? "square"
										: "portrait"
								}
								queryKey={[]}
								userId={user.data.Id}
								imageBlurhash={
									!!item.ImageBlurHashes?.Primary &&
									item.ImageBlurHashes?.Primary[
										Object.keys(
											item.ImageBlurHashes
												.Primary,
										)[0]
									]
								}
							/>
						))}
					</CardScroller>
				)}
				{series.isSuccess && series.data.Items.length > 0 && (
					<CardScroller
						title="TV Shows"
						displayCards={8}
						disableDecoration
					>
						{series.data.Items.map((item, index) => (
							<Card
								item={item}
								seriesId={item.SeriesId}
								cardTitle={
									item.Type == BaseItemKind.Episode
										? item.SeriesName
										: item.Name
								}
								imageType={"Primary"}
								cardCaption={
									item.Type == BaseItemKind.Episode
										? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
										: item.Type ==
										  BaseItemKind.Series
										? `${item.ProductionYear} - ${
												!!item.EndDate
													? new Date(
															item.EndDate,
													  ).toLocaleString(
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
									item.Type == BaseItemKind.Person ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio
								}
								cardType={
									item.Type ==
										BaseItemKind.MusicAlbum ||
									item.Type == BaseItemKind.Audio ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio ||
									item.Type == BaseItemKind.Playlist
										? "square"
										: "portrait"
								}
								queryKey={[]}
								userId={user.data.Id}
								imageBlurhash={
									!!item.ImageBlurHashes?.Primary &&
									item.ImageBlurHashes?.Primary[
										Object.keys(
											item.ImageBlurHashes
												.Primary,
										)[0]
									]
								}
							/>
						))}
					</CardScroller>
				)}
				{audio.isSuccess && audio.data.Items.length > 0 && (
					<CardScroller
						title="Audio"
						displayCards={8}
						disableDecoration
					>
						{audio.data.Items.map((item, index) => (
							<Card
								item={item}
								seriesId={item.SeriesId}
								cardTitle={
									item.Type == BaseItemKind.Episode
										? item.SeriesName
										: item.Name
								}
								imageType={"Primary"}
								cardCaption={
									item.Type == BaseItemKind.Episode
										? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
										: item.Type ==
										  BaseItemKind.Series
										? `${item.ProductionYear} - ${
												!!item.EndDate
													? new Date(
															item.EndDate,
													  ).toLocaleString(
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
									item.Type == BaseItemKind.Person ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio
								}
								cardType={
									item.Type ==
										BaseItemKind.MusicAlbum ||
									item.Type == BaseItemKind.Audio ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio ||
									item.Type == BaseItemKind.Playlist
										? "square"
										: "portrait"
								}
								queryKey={[]}
								userId={user.data.Id}
								imageBlurhash={
									!!item.ImageBlurHashes?.Primary &&
									item.ImageBlurHashes?.Primary[
										Object.keys(
											item.ImageBlurHashes
												.Primary,
										)[0]
									]
								}
							/>
						))}
					</CardScroller>
				)}
				{musicAlbum.isSuccess &&
					musicAlbum.data.Items.length > 0 && (
						<CardScroller
							title="Albums"
							displayCards={8}
							disableDecoration
						>
							{musicAlbum.data.Items.map((item, index) => (
								<Card
									item={item}
									seriesId={item.SeriesId}
									cardTitle={
										item.Type ==
										BaseItemKind.Episode
											? item.SeriesName
											: item.Name
									}
									imageType={"Primary"}
									cardCaption={
										item.Type ==
										BaseItemKind.Episode
											? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
											: item.Type ==
											  BaseItemKind.Series
											? `${
													item.ProductionYear
											  } - ${
													!!item.EndDate
														? new Date(
																item.EndDate,
														  ).toLocaleString(
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
										item.Type ==
											BaseItemKind.Person ||
										item.Type ==
											BaseItemKind.Genre ||
										item.Type ==
											BaseItemKind.MusicGenre ||
										item.Type ==
											BaseItemKind.Studio
									}
									cardType={
										item.Type ==
											BaseItemKind.MusicAlbum ||
										item.Type ==
											BaseItemKind.Audio ||
										item.Type ==
											BaseItemKind.Genre ||
										item.Type ==
											BaseItemKind.MusicGenre ||
										item.Type ==
											BaseItemKind.Studio ||
										item.Type ==
											BaseItemKind.Playlist
											? "square"
											: "portrait"
									}
									queryKey={[]}
									userId={user.data.Id}
									imageBlurhash={
										!!item.ImageBlurHashes
											?.Primary &&
										item.ImageBlurHashes?.Primary[
											Object.keys(
												item.ImageBlurHashes
													.Primary,
											)[0]
										]
									}
								/>
							))}
						</CardScroller>
					)}
				{book.isSuccess && book.data.Items.length > 0 && (
					<CardScroller
						title="Books"
						displayCards={8}
						disableDecoration
					>
						{book.data.Items.map((item, index) => (
							<Card
								item={item}
								seriesId={item.SeriesId}
								cardTitle={
									item.Type == BaseItemKind.Episode
										? item.SeriesName
										: item.Name
								}
								imageType={"Primary"}
								cardCaption={
									item.Type == BaseItemKind.Episode
										? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
										: item.Type ==
										  BaseItemKind.Series
										? `${item.ProductionYear} - ${
												!!item.EndDate
													? new Date(
															item.EndDate,
													  ).toLocaleString(
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
									item.Type == BaseItemKind.Person ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio
								}
								cardType={
									item.Type ==
										BaseItemKind.MusicAlbum ||
									item.Type == BaseItemKind.Audio ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio ||
									item.Type == BaseItemKind.Playlist
										? "square"
										: "portrait"
								}
								queryKey={[]}
								userId={user.data.Id}
								imageBlurhash={
									!!item.ImageBlurHashes?.Primary &&
									item.ImageBlurHashes?.Primary[
										Object.keys(
											item.ImageBlurHashes
												.Primary,
										)[0]
									]
								}
							/>
						))}
					</CardScroller>
				)}
				{musicArtists.isSuccess &&
					musicArtists.data.Items.length > 0 && (
						<CardScroller
							title="Artists"
							displayCards={8}
							disableDecoration
						>
							{musicArtists.data.Items.map(
								(item, index) => (
									<Card
										item={item}
										seriesId={item.SeriesId}
										cardTitle={
											item.Type ==
											BaseItemKind.Episode
												? item.SeriesName
												: item.Name
										}
										imageType={"Primary"}
										cardCaption={
											item.Type ==
											BaseItemKind.Episode
												? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
												: item.Type ==
												  BaseItemKind.Series
												? `${
														item.ProductionYear
												  } - ${
														!!item.EndDate
															? new Date(
																	item.EndDate,
															  ).toLocaleString(
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
											item.Type ==
												BaseItemKind.Person ||
											item.Type ==
												BaseItemKind.Genre ||
											item.Type ==
												BaseItemKind.MusicGenre ||
											item.Type ==
												BaseItemKind.Studio
										}
										cardType={
											item.Type ==
												BaseItemKind.MusicAlbum ||
											item.Type ==
												BaseItemKind.Audio ||
											item.Type ==
												BaseItemKind.Genre ||
											item.Type ==
												BaseItemKind.MusicGenre ||
											item.Type ==
												BaseItemKind.Studio ||
											item.Type ==
												BaseItemKind.Playlist
												? "square"
												: "portrait"
										}
										queryKey={[]}
										userId={user.data.Id}
										imageBlurhash={
											!!item.ImageBlurHashes
												?.Primary &&
											item.ImageBlurHashes
												?.Primary[
												Object.keys(
													item
														.ImageBlurHashes
														.Primary,
												)[0]
											]
										}
									/>
								),
							)}
						</CardScroller>
					)}
				{person.isSuccess && person.data.Items.length > 0 && (
					<CardScroller
						title="People"
						displayCards={8}
						disableDecoration
					>
						{person.data.Items.map((item, index) => (
							<Card
								item={item}
								seriesId={item.SeriesId}
								cardTitle={
									item.Type == BaseItemKind.Episode
										? item.SeriesName
										: item.Name
								}
								imageType={"Primary"}
								cardCaption={
									item.Type == BaseItemKind.Episode
										? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
										: item.Type ==
										  BaseItemKind.Series
										? `${item.ProductionYear} - ${
												!!item.EndDate
													? new Date(
															item.EndDate,
													  ).toLocaleString(
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
									item.Type == BaseItemKind.Person ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio
								}
								cardType={
									item.Type ==
										BaseItemKind.MusicAlbum ||
									item.Type == BaseItemKind.Audio ||
									item.Type == BaseItemKind.Genre ||
									item.Type ==
										BaseItemKind.MusicGenre ||
									item.Type == BaseItemKind.Studio ||
									item.Type == BaseItemKind.Playlist
										? "square"
										: "portrait"
								}
								queryKey={[]}
								userId={user.data.Id}
								imageBlurhash={
									!!item.ImageBlurHashes?.Primary &&
									item.ImageBlurHashes?.Primary[
										Object.keys(
											item.ImageBlurHashes
												.Primary,
										)[0]
									]
								}
							/>
						))}
					</CardScroller>
				)}
			</div>
		</div>
	);
};

export default SearchPage;
