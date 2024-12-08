import { Link, Typography } from "@mui/material";
import React, { memo } from "react";

import anidbIcon from "../../assets/icons/anidb.png";
import anilistIcon from "../../assets/icons/anilist.svg";
import audioDBIcon from "../../assets/icons/audioDB.png";
import imdbIcon from "../../assets/icons/imdb.svg";
import kitsuIcon from "../../assets/icons/kitsu.svg";
import musicBrainzIcon from "../../assets/icons/musicbrainz.svg";
import tvDbIcon from "../../assets/icons/the-tvdb.svg";
import tmdbIcon from "../../assets/icons/themoviedatabase.svg";
import traktIcon from "../../assets/icons/trakt.svg";
import tvMazeIcon from "../../assets/icons/tvmaze.png";

const knownIcons = [
	"imdb",
	"themoviedb",
	"trakt",
	"musicbrainz",
	"thetvdb",
	"anidb",
	"anilist",
	"tvmaze",
	"theaudiodb",
	"kitsu",
];

const IconLink = memo(({ name, url }: { name: string; url: string }) => {
	return (
		<Link target="_blank" href={url} className="item-detail-link">
			{name.toLocaleLowerCase() === "imdb" && <img src={imdbIcon} alt="IMDb" />}
			{name.toLocaleLowerCase() === "themoviedb" && (
				<img src={tmdbIcon} alt="TheMovieDb" />
			)}
			{name.toLocaleLowerCase() === "trakt" && (
				<img src={traktIcon} alt="Trakt" />
			)}
			{name.toLocaleLowerCase() === "musicbrainz" && (
				<img src={musicBrainzIcon} alt="MusicBrainz" />
			)}
			{name.toLocaleLowerCase() === "thetvdb" && (
				<img src={tvDbIcon} alt="TheTVDB" />
			)}
			{name.toLocaleLowerCase() === "anidb" && (
				<img src={anidbIcon} alt="AniDB" />
			)}
			{name.toLocaleLowerCase() === "anilist" && (
				<img src={anilistIcon} alt="AniList" />
			)}
			{name.toLocaleLowerCase() === "tvmaze" && (
				<img src={tvMazeIcon} alt="TVMaze" />
			)}
			{name.toLocaleLowerCase() === "theaudiodb" && (
				<img src={audioDBIcon} alt="TheAudioDB" />
			)}
			{name.toLocaleLowerCase() === "kitsu" && (
				<img src={kitsuIcon} alt="Kitsu" />
			)}
			{!knownIcons.includes(name.toLocaleLowerCase()) && (
				<Typography>{name}</Typography>
			)}
		</Link>
	);
});

export default IconLink;
