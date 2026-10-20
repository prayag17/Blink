import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import PlayButton from "@/components/buttons/playButton";
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import { getUpcomingEpisodesQueryOptions } from "@/utils/queries/itemDetail";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import CastAndCrew from "../castAndCrew";
import ItemDetailLayout, { ExternalLinks } from "../itemDetailLayout";
import { TrackSelectors, useMediaTracks } from "../mediaTracks";
import SimilarItems from "../similarItems";

const UpcomingEpisodes = ({ episode }: { episode: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const options = getUpcomingEpisodesQueryOptions(api, user?.Id, episode);
	const upcomingEpisodes = useQuery(options);

	if (!upcomingEpisodes.data?.Items?.length) return null;

	return (
		<CardScroller title="Upcoming Episodes" displayCards={4} disableDecoration>
			{upcomingEpisodes.data.Items.map((upcoming) => (
				<Card
					key={upcoming.Id}
					item={upcoming}
					cardTitle={upcoming.SeriesName}
					imageType="Primary"
					cardCaption={`S${upcoming.ParentIndexNumber}:E${upcoming.IndexNumber} - ${upcoming.Name}`}
					cardType="thumb"
					queryKey={options.queryKey as string[]}
					userId={user?.Id}
				/>
			))}
		</CardScroller>
	);
};

/** Movies, episodes, videos and any other playable item. */
const DefaultView = ({ item }: { item: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const { tracks, selection, setSelection, mediaQualityInfo } =
		useMediaTracks(item);
	const isEpisode = item.Type === BaseItemKind.Episode;

	return (
		<ItemDetailLayout
			item={item}
			variant={isEpisode ? "episode" : "default"}
			mediaQualityInfo={mediaQualityInfo}
			playButton={
				<PlayButton
					item={item}
					itemType={item.Type ?? "Movie"}
					audio={item.Type === BaseItemKind.Audio}
					currentVideoTrack={selection.video}
					currentAudioTrack={selection.audio}
					currentSubTrack={selection.subtitle}
					userId={user?.Id}
					buttonProps={{ fullWidth: true }}
				/>
			}
			aside={
				<>
					<TrackSelectors
						tracks={tracks}
						selection={selection}
						setSelection={setSelection}
					/>
					<ExternalLinks item={item} />
				</>
			}
		>
			<CastAndCrew people={item.People} api={api} />
			{isEpisode ? (
				<UpcomingEpisodes episode={item} />
			) : (
				<SimilarItems item={item} />
			)}
		</ItemDetailLayout>
	);
};

export default DefaultView;
