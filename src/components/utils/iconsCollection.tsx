import * as generatedClient from "@jellyfin/sdk/lib/generated-client";
import React from "react";

export const getTypeIcon = (
	icon:
		| generatedClient.BaseItemKind
		| generatedClient.CollectionType
		| "Home"
		| "User"
		| "universal",
) => {
	switch (icon) {
		case "Home":
			return <div className="material-symbols-rounded">home</div>;
		case generatedClient.BaseItemKind.Audio:
			return <div className="material-symbols-rounded">mic</div>;
		case generatedClient.BaseItemKind.AudioBook:
			return <div className="material-symbols-rounded">speech_to_text</div>;
		case generatedClient.BaseItemKind.Book:
			return <div className="material-symbols-rounded">book</div>;
		case "boxsets":
		case generatedClient.BaseItemKind.BoxSet:
			return <div className="material-symbols-rounded">video_library</div>;
		case "livetv":
		case generatedClient.BaseItemKind.TvProgram:
		case generatedClient.BaseItemKind.TvChannel:
		case generatedClient.BaseItemKind.Program:
		case generatedClient.BaseItemKind.Recording:
		case generatedClient.BaseItemKind.LiveTvChannel:
		case generatedClient.BaseItemKind.LiveTvProgram:
		case generatedClient.BaseItemKind.ChannelFolderItem:
		case generatedClient.BaseItemKind.Channel:
			return (
				<div className="material-symbols-rounded">settings_input_antenna</div>
			);
		case "tvshows":
		case generatedClient.BaseItemKind.Season:
		case generatedClient.BaseItemKind.Series:
		case generatedClient.BaseItemKind.Episode:
			return <div className="material-symbols-rounded">tv_gen</div>;
		case "playlists":
		case generatedClient.BaseItemKind.Playlist:
		case generatedClient.BaseItemKind.PlaylistsFolder:
		case generatedClient.BaseItemKind.ManualPlaylistsFolder:
			return <div className="material-symbols-rounded">queue_music</div>;
		case "movies":
		case generatedClient.BaseItemKind.Movie:
			return <div className="material-symbols-rounded">movie</div>;
		case generatedClient.BaseItemKind.MusicAlbum:
			return <div className="material-symbols-rounded">album</div>;
		case generatedClient.BaseItemKind.MusicArtist:
			return <div className="material-symbols-rounded">artist</div>;
		case generatedClient.BaseItemKind.Genre:
		case generatedClient.BaseItemKind.MusicGenre:
			return <div className="material-symbols-rounded">domino_mask</div>;
		case "musicvideos":
		case generatedClient.BaseItemKind.MusicVideo:
			return <div className="material-symbols-rounded">music_video</div>;
		case "User":
		case generatedClient.BaseItemKind.Person:
			return <div className="material-symbols-rounded">person</div>;
		case generatedClient.BaseItemKind.Photo:
			return <div className="material-symbols-rounded">image</div>;
		case "photos":
		case generatedClient.BaseItemKind.PhotoAlbum:
			return <div className="material-symbols-rounded">photo_library</div>;
		case "universal":
		case generatedClient.BaseItemKind.Studio:
			return <div className="material-symbols-rounded">category</div>;
		case "trailers":
		case generatedClient.BaseItemKind.Trailer:
			return <div className="material-symbols-rounded">smart_display</div>;
		case generatedClient.BaseItemKind.Video:
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
