/** @format */

import { MdiMovieOutline } from "../icons/mdiMovieOutline";
import { MdiMusicBoxMultipleOutline } from "../icons/mdiMusicBoxMultipleOutline";
import { MdiPlaylistMusicOutline } from "../icons/mdiPlaylistMusicOutline";
import { MdiTelevision } from "../icons/mdiTelevision";
import { MdiFolderOutline } from "../icons/mdiFolderOutline";
import { MdiFolderMusicOutline } from "../icons/mdiFolderMusicOutline";
import { MdiYoutube } from "../icons/mdiYoutube";
import { MdiMultimedia } from "../icons/mdiMultiMedia";
import { MdiBookMultiple } from "../icons/mdiBookMultiple";
import { MdiImageMultiple } from "../icons/mdiImageMultiple";
import { MdiTelevisionClassic } from "../icons/mdiTelevisionClassic";
import { MdiFilmstrip } from "../icons/mdiFilmstrip";
import { MdiMicrophone } from "../icons/mdiMicrophone";
import { MdiImage } from "../icons/mdiImage";
import { MdiBook } from "../icons/mdiBook";

export const MediaCollectionTypeIconCollection = {
	universal: <MdiMultimedia />,
	movies: <MdiMovieOutline />,
	music: <MdiMusicBoxMultipleOutline />,
	playlists: <MdiPlaylistMusicOutline />,
	tvshows: <MdiTelevision />,
	boxsets: <MdiMovieOutline />,
	musicvideos: <MdiFolderMusicOutline />,
	trailers: <MdiYoutube />,
	books: <MdiBookMultiple />,
	photos: <MdiImageMultiple />,
	livetv: <MdiTelevisionClassic />,
	folder: <MdiFolderOutline />,
	logout: <MdiFolderOutline />,
};

export const MediaCollectionTypeIconCollectionCard = {
	universal: <MdiMultimedia className="card-image-icon" />,
	movies: <MdiMovieOutline className="card-image-icon" />,
	music: <MdiMusicBoxMultipleOutline className="card-image-icon" />,
	playlists: <MdiPlaylistMusicOutline className="card-image-icon" />,
	tvshows: <MdiTelevision className="card-image-icon" />,
	boxsets: <MdiMovieOutline className="card-image-icon" />,
	musicvideos: <MdiFolderMusicOutline className="card-image-icon" />,
	trailers: <MdiYoutube className="card-image-icon" />,
	books: <MdiBookMultiple className="card-image-icon" />,
	photos: <MdiImageMultiple className="card-image-icon" />,
	livetv: <MdiTelevisionClassic className="card-image-icon" />,
	folder: <MdiFolderOutline className="card-image-icon" />,
};

export const MediaTypeIconCollection = {
	Movie: <MdiFilmstrip className="hero-carousel-background-icon" />,
	Audio: <MdiMicrophone className="hero-carousel-background-icon" />,
	Photo: <MdiImage className="hero-carousel-background-icon" />,
	Book: <MdiBook className="hero-carousel-background-icon" />,
};

export const MediaTypeIconCollectionCard = {
	Movie: <MdiFilmstrip className="card-image-icon" />,
	Audio: <MdiMicrophone className="card-image-icon" />,
	Photo: <MdiImage className="card-image-icon" />,
	Book: <MdiBook className="card-image-icon" />,
};
