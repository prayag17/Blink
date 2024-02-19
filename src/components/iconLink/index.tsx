import { Link, Typography } from "@mui/material";
import React from "react";

import imdbIcon from "../../assets/icons/imdb.svg";
import musicBrainzIcon from "../../assets/icons/musicbrainz.svg";
import tvDbIcon from "../../assets/icons/the-tvdb.svg";
import tmdbIcon from "../../assets/icons/themoviedatabase.svg";
import traktIcon from "../../assets/icons/trakt.svg";

const knownIcons = ["imdb", "themoviedb", "trakt", "musicbrainz", "thetvdb"];

const IconLink = ({ name, url }: { name: string; url: string }) => {
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
				<img src={tvDbIcon} alt="THeTVDB" />
			)}
			{!knownIcons.includes(name.toLocaleLowerCase()) && (
				<Typography>{name}</Typography>
			)}
		</Link>
	);
};

export default IconLink;
