/** @format */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import { useParams } from "react-router-dom";

import { motion } from "framer-motion";

import {
	BaseItemKind,
	ItemFields,
	MediaStreamType,
} from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";

import { useQuery } from "@tanstack/react-query";

import Hero from "../../components/layouts/item/hero";
import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";

import "./episode.module.scss";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import { useBackdropStore } from "../../utils/store/backdrop";
import { ActorCard } from "../../components/card/actorCards";
import { useApi } from "../../utils/store/api";

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
			style={{ marginTop: "1em" }}
		>
			{value === index && <Box>{children}</Box>}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

const EpisodeTitlePage = () => {
	const { id } = useParams();
	const [api] = useApi((state) => [state.api]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
		enabled: Boolean(api),
	});

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getItem({
				userId: user.data.Id,
				itemId: id,
				fields: [ItemFields.Crew],
			});
			return result.data;
		},
		enabled: !!user.data,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const [videoTracks, setVideoTracks] = useState([]);
	const [audioTracks, setAudioTracks] = useState([]);
	const [subtitleTracks, setSubtitleTracks] = useState([]);

	const filterMediaStreamVideo = (source) => {
		if (source.Type == MediaStreamType.Video) {
			return true;
		}
		return false;
	};
	const filterMediaStreamAudio = (source) => {
		if (source.Type == MediaStreamType.Audio) {
			return true;
		}
		return false;
	};
	const filterMediaStreamSubtitle = (source) => {
		if (source.Type == MediaStreamType.Subtitle) {
			return true;
		}
		return false;
	};

	useEffect(() => {
		if (item.isSuccess && !!item.data.MediaStreams) {
			let videos = item.data.MediaStreams.filter(
				filterMediaStreamVideo,
			);
			let audios = item.data.MediaStreams.filter(
				filterMediaStreamAudio,
			);
			let subs = item.data.MediaStreams.filter(
				filterMediaStreamSubtitle,
			);

			setVideoTracks(videos);
			setAudioTracks(audios);
			setSubtitleTracks(subs);
		}
	}, [item.isSuccess]);

	const upcomingEpisodes = useQuery({
		queryKey: ["item", id, "episode", "upcomingEpisodes"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
				parentId: item.data.ParentId,
				startIndex: item.data.IndexNumber,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.Episode,
		networkMode: "always",
	});

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	const [directors, setDirectors] = useState([]);
	const [writers, setWriters] = useState([]);
	useEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop(
				item.data.Type === BaseItemKind.MusicAlbum ||
					item.data.Type === BaseItemKind.Episode
					? `${api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
					: `${api.basePath}/Items/${item.data.Id}/Images/Backdrop`,
				item.data.Id,
			);
			let direTp = item.data.People.filter(
				(itm) => itm.Type == "Director",
			);
			setDirectors(direTp);
			let writeTp = item.data.People.filter(
				(itm) => itm.Type == "Writer",
			);
			setWriters(writeTp);
		}
	}, [item.isSuccess]);

	if (item.isPending) {
		return (
			<Box
				sx={{
					width: "100%",
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}
	if (item.isSuccess) {
		return (
			<motion.div
				key={id}
				initial={{
					opacity: 0,
				}}
				animate={{
					opacity: 1,
				}}
				transition={{
					duration: 0.25,
					ease: "easeInOut",
				}}
				className="scrollY episode"
				style={{
					padding: "5em 2em 2em 1em",
					display: "flex",
					flexDirection: "column",
					gap: "0.5em",
				}}
			>
				<Hero
					item={item.data}
					userId={user.data.Id}
					queryKey={["item", id]}
					writers={writers}
					directors={directors}
					videoTracks={videoTracks}
					audioTracks={audioTracks}
					subtitleTracks={subtitleTracks}
					favourParentImg={false}
					isEpisode
					cardType="thumb"
					enableVideoInfoStrip
				/>
				{item.data.People.length > 0 && (
					<CardScroller
						title="Cast & Crew"
						displayCards={8}
						disableDecoration
					>
						{item.data.People.map((person) => {
							return (
								<ActorCard
									key={person.Id}
									item={person}
									cardTitle={person.Name}
									cardCaption={person.Role}
									cardType="square"
									userId={user.data.Id}
									imageBlurhash={
										person.ImageBlurHashes
											?.Primary[0]
									}
									overrideIcon="Person"
									disableOverlay
								/>
							);
						})}
					</CardScroller>
				)}
				{upcomingEpisodes.isSuccess &&
					upcomingEpisodes.data.Items.length > 0 && (
						<CardScroller
							title="Upcoming Episodes"
							displayCards={4}
							disableDecoration
						>
							{upcomingEpisodes.data.Items.map(
								(episode) => {
									return (
										<Card
											key={episode.Id}
											item={episode}
											cardTitle={
												episode.SeriesName
											}
											imageType="Primary"
											cardCaption={`S${episode.ParentIndexNumber}:E${episode.IndexNumber} - ${episode.Name}`}
											cardType="thumb"
											queryKey={[
												"item",
												id,
												"episode",
												"upcomingEpisodes",
											]}
											userId={user.data.Id}
											imageBlurhash={
												!!episode
													.ImageBlurHashes
													?.Primary &&
												episode
													.ImageBlurHashes
													?.Primary[
													Object.keys(
														episode
															.ImageBlurHashes
															.Primary,
													)[0]
												]
											}
										></Card>
									);
								},
							)}
						</CardScroller>
					)}
			</motion.div>
		);
	}
	if (item.isError) {
		return <ErrorNotice />;
	}
};

export default EpisodeTitlePage;
