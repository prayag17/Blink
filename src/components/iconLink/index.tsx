import { Link, Tooltip } from "@mui/material";
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

/**
 * Provider icons keyed by the start of the normalized link name, so variants like
 * "TMDB"/"TheMovieDb", "TVDB"/"TheTVDB" or "MusicBrainz Artist" all match.
 */
const providerIcons: [prefixes: string[], icon: string][] = [
	[["imdb"], imdbIcon],
	[["tmdb", "themoviedb"], tmdbIcon],
	[["tvdb", "thetvdb"], tvDbIcon],
	[["trakt"], traktIcon],
	[["musicbrainz"], musicBrainzIcon],
	[["anidb"], anidbIcon],
	[["anilist"], anilistIcon],
	[["tvmaze"], tvMazeIcon],
	[["theaudiodb", "audiodb"], audioDBIcon],
	[["kitsu"], kitsuIcon],
];

const getProviderIcon = (name: string) => {
	const normalized = name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
	return providerIcons.find(([prefixes]) =>
		prefixes.some((prefix) => normalized.startsWith(prefix)),
	)?.[1];
};

const IconLink = memo(({ name, url }: { name: string; url: string }) => {
	const icon = getProviderIcon(name);
	return (
		<Tooltip title={name}>
			<Link
				target="_blank"
				href={url}
				className="item-detail-link"
				aria-label={name}
			>
				{icon ? (
					<img src={icon} alt={name} />
				) : (
					<span className="material-symbols-rounded item-detail-link-generic">
						link
					</span>
				)}
			</Link>
		</Tooltip>
	);
});

export default IconLink;
