import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import React from "react";
import { MdiAccount } from "../icons/mdiAccount";
import { MdiAccountMusic } from "../icons/mdiAccountMusic";
import { MdiAccountTie } from "../icons/mdiAccountTie";
import { MdiAlbum } from "../icons/mdiAlbum";
import { MdiBook } from "../icons/mdiBook";
import { MdiBookMultiple } from "../icons/mdiBookMultiple";
import { MdiBookMusic } from "../icons/mdiBookMusic";
import { MdiDramaMasks } from "../icons/mdiDramaMasks";
import { MdiFilmstrip } from "../icons/mdiFilmstrip";
import { MdiFilmstripBoxMultiple } from "../icons/mdiFilmstripBoxMultiple";
import { MdiFolderMultiple } from "../icons/mdiFolderMultiple";
import { MdiFolderMusicOutline } from "../icons/mdiFolderMusicOutline";
import { MdiFolderOutline } from "../icons/mdiFolderOutline";
import { MdiImage } from "../icons/mdiImage";
import { MdiImageMultiple } from "../icons/mdiImageMultiple";
import { MdiMicrophone } from "../icons/mdiMicrophone";
import { MdiMovieOutline } from "../icons/mdiMovieOutline";
import { MdiMultimedia } from "../icons/mdiMultimedia";
import { MdiMusic } from "../icons/mdiMusic";
import { MdiMusicBoxMultipleOutline } from "../icons/mdiMusicBoxMultipleOutline";
import { MdiPlayBoxMultiple } from "../icons/mdiPlayBoxMultiple";
import { MdiPlaylistMusicOutline } from "../icons/mdiPlaylistMusicOutline";
import { MdiTelevision } from "../icons/mdiTelevision";
import { MdiTelevisionClassic } from "../icons/mdiTelevisionClassic";
import { MdiYoutube } from "../icons/mdiYoutube";

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

export const getTypeIcon = (icon) => {
	switch (icon) {
		case "Home":
			return <div className="material-symbols-rounded">home</div>;
		case BaseItemKind.Audio:
			return <div className="material-symbols-rounded">mic</div>;
		case BaseItemKind.AudioBook:
			return <div className="material-symbols-rounded">speech_to_text</div>;
		case BaseItemKind.Book:
			return <div className="material-symbols-rounded">book</div>;
		case "boxsets":
		case BaseItemKind.BoxSet:
			return <div className="material-symbols-rounded">video_library</div>;
		case "livetv":
		case BaseItemKind.TvProgram:
		case BaseItemKind.TvChannel:
		case BaseItemKind.Program:
		case BaseItemKind.Recording:
		case BaseItemKind.LiveTvChannel:
		case BaseItemKind.LiveTvProgram:
		case BaseItemKind.ChannelFolderItem:
		case BaseItemKind.Channel:
			return (
				<div className="material-symbols-rounded">settings_input_antenna</div>
			);
		case "tvshows":
		case BaseItemKind.Season:
		case BaseItemKind.Series:
		case BaseItemKind.Episode:
			return <div className="material-symbols-rounded">tv_gen</div>;
		case "playlists":
		case BaseItemKind.Playlist:
		case BaseItemKind.PlaylistsFolder:
		case BaseItemKind.ManualPlaylistsFolder:
			return <div className="material-symbols-rounded">queue_music</div>;
		case "movies":
		case BaseItemKind.Movie:
			return <div className="material-symbols-rounded">movie</div>;
		case BaseItemKind.MusicAlbum:
			return <div className="material-symbols-rounded">album</div>;
		case BaseItemKind.MusicArtist:
			return <div className="material-symbols-rounded">artist</div>;
		case BaseItemKind.Genre:
		case BaseItemKind.MusicGenre:
			return <div className="material-symbols-rounded">domino_mask</div>;
		case "musicvideos":
		case BaseItemKind.MusicVideo:
			return <div className="material-symbols-rounded">music_video</div>;
		case "User":
		case BaseItemKind.Person:
			return <div className="material-symbols-rounded">person</div>;
		case BaseItemKind.Photo:
			return <div className="material-symbols-rounded">image</div>;
		case "photos":
		case BaseItemKind.PhotoAlbum:
			return <div className="material-symbols-rounded">photo_library</div>;
		case "universal":
		case BaseItemKind.Studio:
			return <div className="material-symbols-rounded">category</div>;
		case "trailers":
		case BaseItemKind.Trailer:
			return <div className="material-symbols-rounded">smart_display</div>;
		case BaseItemKind.Video:
			return <div className="material-symbols-rounded">theaters</div>;
		case "music":
			return <div className="material-symbols-rounded">library_music</div>;
		case "books":
			return <div className="material-symbols-rounded">library_books</div>;
		case "folders":
			return <div className="material-symbols-rounded">folder</div>;
		default:
			return <div className="material-symbols-rounded">description</div>;
	}
};
