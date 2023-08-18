/** @format */

import { MdiMovieOutline } from "../icons/mdiMovieOutline";
import { MdiMusicBoxMultipleOutline } from "../icons/mdiMusicBoxMultipleOutline";
import { MdiPlaylistMusicOutline } from "../icons/mdiPlaylistMusicOutline";
import { MdiTelevision } from "../icons/mdiTelevision";
import { MdiFolderOutline } from "../icons/mdiFolderOutline";
import { MdiFolderMusicOutline } from "../icons/mdiFolderMusicOutline";
import { MdiYoutube } from "../icons/mdiYoutube";
import { MdiMultimedia } from "../icons/mdiMultimedia";
import { MdiBookMultiple } from "../icons/mdiBookMultiple";
import { MdiImageMultiple } from "../icons/mdiImageMultiple";
import { MdiTelevisionClassic } from "../icons/mdiTelevisionClassic";
import { MdiFilmstrip } from "../icons/mdiFilmstrip";
import { MdiMicrophone } from "../icons/mdiMicrophone";
import { MdiImage } from "../icons/mdiImage";
import { MdiBook } from "../icons/mdiBook";
import { MdiFolderMultiple } from "../icons/mdiFolderMultiple";
import { MdiBookMusic } from "../icons/mdiBookMusic";
import { MdiPlayBoxMultiple } from "../icons/mdiPlayBoxMultiple";
import { MdiAlbum } from "../icons/mdiAlbum";
import { MdiAccountMusic } from "../icons/mdiAccountMusic";
import { MdiDramaMasks } from "../icons/mdiDramaMasks";
import { MdiMusic } from "../icons/mdiMusic";
import { MdiAccountTie } from "../icons/mdiAccountTie";
import { MdiAccount } from "../icons/mdiAccount";
import { MdiFilmstripBoxMultiple } from "../icons/mdiFilmstripBoxMultiple";

export const MediaCollectionTypeIconCollection = {
	universal: <MdiMultimedia />,
	movies: <MdiMovieOutline />,
	music: <MdiMusicBoxMultipleOutline />,
	playlists: <MdiPlaylistMusicOutline />,
	tvshows: <MdiTelevision />,
	boxsets: <MdiFilmstripBoxMultiple />,
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
	boxsets: <MdiFilmstripBoxMultiple className="card-image-icon" />,
	musicvideos: <MdiFolderMusicOutline className="card-image-icon" />,
	trailers: <MdiYoutube className="card-image-icon" />,
	books: <MdiBookMultiple className="card-image-icon" />,
	photos: <MdiImageMultiple className="card-image-icon" />,
	livetv: <MdiTelevisionClassic className="card-image-icon" />,
	folder: <MdiFolderOutline className="card-image-icon" />,
};

export const MediaTypeIconCollection = {
	Movie: <MdiFilmstrip className="hero-carousel-background-icon" />,
	Series: <MdiTelevision className="hero-carousel-background-icon" />,
	Audio: <MdiMicrophone className="hero-carousel-background-icon" />,
	Photo: <MdiImage className="hero-carousel-background-icon" />,
	Book: <MdiBook className="hero-carousel-background-icon" />,
	MusicAlbum: <MdiAlbum className="hero-carousel-background-icon" />,
	AudioBook: <MdiBookMusic className="hero-carousel-background-icon" />,
};

export const TypeIconCollectionCard = {
	AggregateFolder: <MdiFolderMultiple className="card-image-icon" />,
	Audio: <MdiMicrophone className="card-image-icon" />,
	AudioBook: <MdiBookMusic className="card-image-icon" />,
	BasePluginFolder: <MdiFolderOutline className="card-image-icon" />,
	Book: <MdiBook className="card-image-icon" />,
	BoxSet: <MdiPlayBoxMultiple className="card-image-icon" />,
	Channel: <MdiTelevisionClassic className="card-image-icon" />,
	ChannelFolderItem: <MdiTelevisionClassic className="card-image-icon" />,
	CollectionFolder: <MdiFolderOutline className="card-image-icon" />,
	Episode: <MdiTelevision className="card-image-icon" />,
	Folder: <MdiFolderOutline className="card-image-icon" />,
	LiveTvChannel: <MdiTelevisionClassic className="card-image-icon" />,
	LiveTvProgram: <MdiTelevisionClassic className="card-image-icon" />,
	ManualPlaylistsFolder: (
		<MdiPlaylistMusicOutline className="card-image-icon" />
	),
	Movie: <MdiFilmstrip className="card-image-icon" />,
	MusicAlbum: <MdiAlbum className="card-image-icon" />,
	MusicArtist: <MdiAccountMusic className="card-image-icon" />,
	MusicGenre: <MdiDramaMasks className="card-image-icon" />,
	MusicVideo: <MdiMusic className="card-image-icon" />,
	Person: <MdiAccountTie className="card-image-icon" />,
	Photo: <MdiImage className="card-image-icon" />,
	PhotoAlbum: <MdiImageMultiple className="card-image-icon" />,
	Playlist: <MdiPlaylistMusicOutline className="card-image-icon" />,
	PlaylistsFolder: <MdiPlaylistMusicOutline className="card-image-icon" />,
	Program: <MdiTelevisionClassic className="card-image-icon" />,
	Recording: <MdiTelevisionClassic className="card-image-icon" />,
	Season: <MdiTelevisionClassic className="card-image-icon" />,
	Series: <MdiTelevisionClassic className="card-image-icon" />,
	Studio: <MdiMultimedia className="card-image-icon" />,
	Trailer: <MdiYoutube className="card-image-icon" />,
	TvChannel: <MdiTelevisionClassic className="card-image-icon" />,
	TvProgram: <MdiTelevisionClassic className="card-image-icon" />,
	User: <MdiAccount className="card-image-icon" />,
	UserRootFolder: <MdiFolderOutline className="card-image-icon" />,
	UserView: <MdiMultimedia className="card-image-icon" />,
	Video: <MdiFilmstrip className="card-image-icon" />,
	Year: <MdiMultimedia className="card-image-icon" />,
	Genre: <MdiDramaMasks className="card-image-icon" />,
};
