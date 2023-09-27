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

	const items = useQuery({
		queryKey: ["search", "items", searchParam],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItemsByUserId({
				userId: user.data.Id,
				searchTerm: searchTerm,
				includeItemTypes: [
					BaseItemKind.Movie,
					BaseItemKind.Series,
					BaseItemKind.Audio,
					BaseItemKind.MusicAlbum,
					BaseItemKind.Book,
					BaseItemKind.MusicArtist,
					BaseItemKind.Person,
				],
				recursive: true,
			});
			return result.data;
		},
		enabled: user.isSuccess,
	});

	/**
	 * @typedef {import("@jellyfin/sdk/lib/generated-client/models").BaseItemDto} BaseItemDto
	 * @type {[BaseItemDto[], Function]}
	 */
	const [movies, setMovies] = useState([]);
	const [series, setSeries] = useState([]);
	const [audios, setAudios] = useState([]);
	const [musicAlbum, setMusicAlbum] = useState([]);
	const [books, setBooks] = useState([]);
	const [musicArtists, setMusicArtists] = useState([]);
	const [persons, setPersons] = useState([]);

	const itemLimit = 16;

	useEffect(() => {
		if (items.isSuccess) {
			setMovies(
				items.data.Items.filter(
					(item) => item.Type == BaseItemKind.Movie,
				).slice(0, itemLimit),
			);
			setSeries(
				items.data.Items.filter(
					(item) => item.Type == BaseItemKind.Series,
				).slice(0, itemLimit),
			);
			setAudios(
				items.data.Items.filter(
					(item) => item.Type == BaseItemKind.Audio,
				).slice(0, itemLimit),
			);
			setMusicAlbum(
				items.data.Items.filter(
					(item) => item.Type == BaseItemKind.MusicAlbum,
				).slice(0, itemLimit),
			);
			setBooks(
				items.data.Items.filter(
					(item) => item.Type == BaseItemKind.Book,
				).slice(0, itemLimit),
			);
			setMusicArtists(
				items.data.Items.filter(
					(item) => item.Type == BaseItemKind.MusicArtist,
				).slice(0, itemLimit),
			);
			setPersons(
				items.data.Items.filter(
					(item) => item.Type == BaseItemKind.Person,
				).slice(0, itemLimit),
			);
		}
	}, [items.isSuccess]);

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
			{items.isLoading ? (
				<div
					style={{
						height: "calc(100vh - 9em)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<LinearProgress
						style={{
							width: "25%",
						}}
					/>
				</div>
			) : (
				<div
					style={{
						height: "100%",
					}}
				>
					{movies.length > 0 && (
						<CardScroller
							title="Movies"
							displayCards={8}
							disableDecoration
						>
							{movies.map((item, index) => (
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
					{series.length > 0 && (
						<CardScroller
							title="TV Shows"
							displayCards={8}
							disableDecoration
						>
							{series.map((item, index) => (
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
					{audios.length > 0 && (
						<CardScroller
							title="Audio"
							displayCards={8}
							disableDecoration
						>
							{audios.map((item, index) => (
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
					{musicAlbum.length > 0 && (
						<CardScroller
							title="Albums"
							displayCards={8}
							disableDecoration
						>
							{musicAlbum.map((item, index) => (
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
					{books.length > 0 && (
						<CardScroller
							title="Books"
							displayCards={8}
							disableDecoration
						>
							{books.map((item, index) => (
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
					{musicArtists.length > 0 && (
						<CardScroller
							title="Artists"
							displayCards={8}
							disableDecoration
						>
							{musicArtists.map((item, index) => (
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
					{persons.length > 0 && (
						<CardScroller
							title="People"
							displayCards={8}
							disableDecoration
						>
							{persons.map((item, index) => (
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
				</div>
			)}
		</div>
	);
};

export default SearchPage;
