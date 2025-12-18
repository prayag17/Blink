import {
	BaseItemKind,
	CollectionType,
	ItemSortBy,
} from "@jellyfin/sdk/lib/generated-client";

export const AVAILABLE_VIEWS: Array<{
	title: string;
	value: BaseItemKind | "Artist";
	compatibleCollectionTypes: CollectionType[];
}> = [
	{
		title: "Movies",
		value: BaseItemKind.Movie,
		compatibleCollectionTypes: [CollectionType.Movies],
	},
	{
		title: "Shows",
		value: BaseItemKind.Series,
		compatibleCollectionTypes: [CollectionType.Tvshows],
	},
	{
		title: "Albums",
		value: BaseItemKind.MusicAlbum,
		compatibleCollectionTypes: [CollectionType.Music],
	},
	{
		title: "Collections",
		value: BaseItemKind.CollectionFolder,
		compatibleCollectionTypes: [CollectionType.Movies, CollectionType.Boxsets],
	},
	{
		title: "Books",
		value: BaseItemKind.Book,
		compatibleCollectionTypes: [CollectionType.Books],
	},
	{
		title: "Genres",
		compatibleCollectionTypes: [
			CollectionType.Movies,
			CollectionType.Tvshows,
			CollectionType.Music,
		],
		value: BaseItemKind.Genre,
	},
	{
		title: "Trailers",
		value: BaseItemKind.Trailer,
		compatibleCollectionTypes: [CollectionType.Movies],
	},
	{
		title: "TV Networks",
		value: BaseItemKind.Studio,
		compatibleCollectionTypes: [CollectionType.Tvshows],
	},
	{
		title: "Album Artist",
		value: BaseItemKind.MusicArtist,
		compatibleCollectionTypes: [CollectionType.Music],
	},
	{
		title: "Artist",
		value: "Artist",
		compatibleCollectionTypes: [CollectionType.Music],
	},
	{
		title: "Playlist",
		value: BaseItemKind.Playlist,
		compatibleCollectionTypes: [CollectionType.Music, CollectionType.Playlists],
	},
	{
		title: "Songs",
		value: BaseItemKind.Audio,
		compatibleCollectionTypes: [CollectionType.Music],
	},
];

export const SORT_BY_OPTIONS: Array<{
	title: string;
	value: ItemSortBy | ItemSortBy[];
	compatibleCollectionTypes?: CollectionType[];
	compatibleViewTypes?: BaseItemKind[];
}> = [
	{
		title: "Name",
		value: ItemSortBy.SortName,
		compatibleCollectionTypes: [
			CollectionType.Movies,
			CollectionType.Tvshows,
			CollectionType.Boxsets,
			CollectionType.Books,
		],
	},
	{
		title: "Track Name",
		value: ItemSortBy.Name,
		compatibleViewTypes: [
			BaseItemKind.Audio,
			BaseItemKind.MusicAlbum,
			BaseItemKind.Playlist,
		],
	},
	{
		title: "Album",
		value: ItemSortBy.Album,
		compatibleViewTypes: [BaseItemKind.Audio],
	},
	{
		title: "Album Artist",
		value: ItemSortBy.AlbumArtist,
		compatibleViewTypes: [BaseItemKind.Audio, BaseItemKind.MusicAlbum],
	},
	{
		title: "Artist",
		value: ItemSortBy.Artist,
		compatibleViewTypes: [BaseItemKind.Audio],
	},
	{
		title: "Date Added",
		value: ItemSortBy.DateCreated,
		compatibleViewTypes: [
			BaseItemKind.MusicAlbum,
			BaseItemKind.Audio,
			BaseItemKind.Playlist,
		],
		compatibleCollectionTypes: [
			CollectionType.Movies,
			CollectionType.Boxsets,
			CollectionType.Tvshows,
		],
	},
	{
		title: "Date Played",
		value: ItemSortBy.DatePlayed,
		compatibleViewTypes: [BaseItemKind.Audio, BaseItemKind.Playlist],
		compatibleCollectionTypes: [
			CollectionType.Movies,
			CollectionType.Tvshows,
			CollectionType.Boxsets,
		],
	},
	{
		title: "Play Count",
		value: ItemSortBy.PlayCount,
		compatibleViewTypes: [BaseItemKind.Audio, BaseItemKind.Playlist],
		compatibleCollectionTypes: [CollectionType.Movies, CollectionType.Boxsets],
	},
	{
		title: "Release Date",
		value: ItemSortBy.PremiereDate,
		compatibleViewTypes: [
			BaseItemKind.MusicAlbum,
			BaseItemKind.Audio,
			BaseItemKind.Playlist,
		],
		compatibleCollectionTypes: [
			CollectionType.Movies,
			CollectionType.Tvshows,
			CollectionType.Boxsets,
		],
	},
	{
		title: "Runtime",
		value: ItemSortBy.Runtime,
		compatibleViewTypes: [
			BaseItemKind.MusicAlbum,
			BaseItemKind.Audio,
			BaseItemKind.Playlist,
		],
		compatibleCollectionTypes: [CollectionType.Movies, CollectionType.Boxsets],
	},
	{
		title: "Random",
		value: ItemSortBy.Random,
		compatibleViewTypes: [
			// BaseItemKind.MusicAlbum,
			// BaseItemKind.Audio,
			// BaseItemKind.Playlist,
		],
		compatibleCollectionTypes: [
			// CollectionType.Movies,
			// CollectionType.Tvshows,
			// CollectionType.Boxsets,
		],
	},
	{
		title: "Community Rating",
		value: ItemSortBy.CommunityRating,
		compatibleViewTypes: [
			BaseItemKind.MusicAlbum,
			BaseItemKind.Audio,
			BaseItemKind.Playlist,
		],
		compatibleCollectionTypes: [
			CollectionType.Movies,
			CollectionType.Tvshows,
			CollectionType.Boxsets,
		],
	},
	{
		title: "Critics Rating",
		value: ItemSortBy.CriticRating,
		compatibleViewTypes: [
			BaseItemKind.MusicAlbum,
			BaseItemKind.Audio,
			BaseItemKind.Playlist,
		],
		compatibleCollectionTypes: [CollectionType.Movies, CollectionType.Boxsets],
	},
	{
		title: "Folder",
		value: [ItemSortBy.IsFolder, ItemSortBy.SortName],
		compatibleViewTypes: [BaseItemKind.Playlist],
	},
	{
		title: "Parental Rating",
		value: ItemSortBy.OfficialRating,
		compatibleViewTypes: [BaseItemKind.Playlist],
		compatibleCollectionTypes: [
			CollectionType.Movies,
			CollectionType.Tvshows,
			CollectionType.Boxsets,
		],
	},
	{
		title: "Release Date",
		value: [
			ItemSortBy.ProductionYear,
			ItemSortBy.PremiereDate,
			ItemSortBy.SortName,
		],
		compatibleViewTypes: [
			BaseItemKind.MusicAlbum,
			BaseItemKind.Audio,
			BaseItemKind.Playlist,
		],
	},
	{
		title: "Date Episode Added",
		value: ItemSortBy.DateLastContentAdded,
		compatibleCollectionTypes: [CollectionType.Tvshows],
	},
];

export const getDefaultSortByForCollectionType = (
	collectionType: CollectionType,
): ItemSortBy => {
	const option = SORT_BY_OPTIONS.find((opt) =>
		opt.compatibleCollectionTypes?.includes(collectionType),
	);
	return Array.isArray(option?.value)
		? option.value[0]
		: option?.value || ItemSortBy.SortName;
};


export type FILTERS =
	| "isPlayed"
	| "isUnPlayed"
	| "isResumable"
	| "isFavorite"
	| "hasSubtitles"
	| "hasTrailer"
	| "hasSpecialFeature"
	| "hasThemeSong"
	| "hasThemeVideo"
	| "isSD"
	| "isHD"
	| "is4K"
	| "is3D";
