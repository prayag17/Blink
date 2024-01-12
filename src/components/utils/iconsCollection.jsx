import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import React from "react";

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
