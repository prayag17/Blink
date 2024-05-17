import PropTypes from "prop-types";
import React, { useState, useLayoutEffect, useRef } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { green, red, yellow } from "@mui/material/colors";

import { Blurhash } from "react-blurhash";

import useParallax from "@/utils/hooks/useParallax";
import { motion, useScroll } from "framer-motion";

import {
	BaseItemKind,
	ItemFields,
	MediaStreamType,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { useQuery } from "@tanstack/react-query";

import heroBg from "@/assets/herobg.png";
import { Card } from "@/components/card/card";
import { CardScroller } from "@/components/cardScroller/cardScroller";

import "./item.scss";

import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";

import LikeButton from "@/components/buttons/likeButton";
import MarkPlayedButton from "@/components/buttons/markPlayedButton";
import PlayButton from "@/components/buttons/playButton";
import TrailerButton from "@/components/buttons/trailerButton";
import ShowMoreText from "@/components/showMoreText";
import { getTypeIcon } from "@/components/utils/iconsCollection";
import { endsAt, getRuntime } from "@/utils/date/time";
import { setBackdrop, useBackdropStore } from "@/utils/store/backdrop";

import ItemSkeleton from "@/components/skeleton/item";

import ultraHdIcon from "@/assets/icons/4k.svg";
import dolbyAtmosIcon from "@/assets/icons/dolby-atmos.svg";
import dolbyDigitalPlusIcon from "@/assets/icons/dolby-digital-plus.svg";
import dolbyDigitalIcon from "@/assets/icons/dolby-digital.svg";
import dolbyTrueHDIcon from "@/assets/icons/dolby-truehd.svg";
import dolbyVisionAtmosIcon from "@/assets/icons/dolby-vision-atmos.png";
import dolbyVisionIcon from "@/assets/icons/dolby-vision.svg";
import dtsHdMaIcon from "@/assets/icons/dts-hd-ma.svg";
import dtsIcon from "@/assets/icons/dts.svg";
import hdIcon from "@/assets/icons/hd.svg";
import hdrIcon from "@/assets/icons/hdr.svg";
import hdr10PlusIcon from "@/assets/icons/hdr10-plus.svg";
import hdr10Icon from "@/assets/icons/hdr10.svg";
import imaxIcon from "@/assets/icons/imax.svg";
import sdIcon from "@/assets/icons/sd.svg";
import sdrIcon from "@/assets/icons/sdr.svg";

import type MediaQualityInfo from "@/utils/types/mediaQualityInfo";

import IconLink from "@/components/iconLink";
import { Link, createFileRoute } from "@tanstack/react-router";

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

export const Route = createFileRoute("/_api/item/$id")({
	component: ItemDetail,
});

function ItemDetail() {
	const { id } = Route.useParams();

	const api = Route.useRouteContext().api;

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
		enabled: Boolean(api),
	});

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getItem({
				userId: user.data?.Id,
				itemId: id,
			});
			return result.data;
		},
		enabled: !!user.data,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const similarItems = useQuery({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			let result;
			if (item.data.Type === "Movie") {
				result = await getLibraryApi(api).getSimilarMovies({
					userId: user.data.Id,
					itemId: item.data.Id,
					limit: 16,
				});
			} else if (item.data.Type === "Series") {
				result = await getLibraryApi(api).getSimilarShows({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			} else if (item.data.Type === "MusicAlbum") {
				result = await getLibraryApi(api).getSimilarAlbums({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			} else if (item.data.Type === "MusicArtist") {
				result = await getLibraryApi(api).getSimilarArtists({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			} else {
				result = await getLibraryApi(api).getSimilarItems({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			}
			return result.data;
		},
		enabled: item.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const [videoTracks, setVideoTracks] = useState([]);
	const [audioTracks, setAudioTracks] = useState([]);
	const [subtitleTracks, setSubtitleTracks] = useState([]);

	const filterMediaStreamVideo = (source) => {
		if (source.Type === MediaStreamType.Video) {
			return true;
		}
		return false;
	};
	const filterMediaStreamAudio = (source) => {
		if (source.Type === MediaStreamType.Audio) {
			return true;
		}
		return false;
	};
	const filterMediaStreamSubtitle = (source) => {
		if (source.Type === MediaStreamType.Subtitle) {
			return true;
		}
		return false;
	};

	const [selectedVideoTrack, setSelectedVideoTrack] = useState(null);
	const [selectedAudioTrack, setSelectedAudioTrack] = useState(null);
	const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(null);

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	const [directors, setDirectors] = useState([]);
	const [writers, setWriters] = useState([]);
	const [actors, setActors] = useState([]);
	const [producers, setProducers] = useState([]);

	const [mediaQualityInfo, setMediaQualityInfo] = useState<MediaQualityInfo>();

	useLayoutEffect(() => {
		if (item.isSuccess) {
			if (item.data.BackdropImageTags?.length > 0) {
				setBackdrop(
					api?.getItemImageUrl(item.data.Id, "Backdrop", {
						tag: item.data.BackdropImageTags[0],
					}),
					item.data.Id,
				);
			} else {
				setBackdrop("", "");
			}
			const direTp = item.data.People.filter((itm) => itm.Type === "Director");
			setDirectors(direTp);
			const writeTp = item.data.People.filter((itm) => itm.Type === "Writer");
			setWriters(writeTp);
			const producerTp = item.data.People.filter(
				(itm) => itm.Type === "Producer",
			);
			setProducers(producerTp);
			const actorTp = item.data.People.filter((itm) => itm.Type === "Actor");
			setActors(actorTp);

			if (item.data.MediaStreams && item.data.MediaSources?.length > 0) {
				const videos = item.data.MediaStreams.filter(filterMediaStreamVideo);
				const audios = item.data.MediaStreams.filter(filterMediaStreamAudio);
				const subs = item.data.MediaStreams.filter(filterMediaStreamSubtitle);

				setSelectedVideoTrack(videos[0]?.Index ?? null);
				setSelectedAudioTrack(
					item.data.MediaSources[0].DefaultAudioStreamIndex ?? null,
				);
				setSelectedSubtitleTrack(
					item.data.MediaSources[0].DefaultSubtitleStreamIndex === -1 ||
						!item.data.MediaSources[0].DefaultSubtitleStreamIndex
						? "nosub"
						: item.data.MediaSources[0].DefaultSubtitleStreamIndex,
				);

				setVideoTracks(videos);
				setAudioTracks(audios);
				setSubtitleTracks(subs);

				// Analyze item for QualityInfo
				const checkAtmos = audios.filter((audio) =>
					audio.DisplayTitle?.toLocaleLowerCase().includes("atmos"),
				);
				const checkDolbyVision = videos.filter(
					(video) =>
						video.DisplayTitle?.toLocaleLowerCase().includes("dv") ||
						video.DisplayTitle?.toLocaleLowerCase().includes("dolby vision") ||
						!!video.VideoDoViTitle ||
						video.VideoRangeType === "DOVI",
				);
				const checkDD = audios.filter(
					(audio) =>
						(audio.DisplayTitle?.toLocaleLowerCase().includes("dd") &&
							!audio.DisplayTitle?.toLocaleLowerCase().includes("ddp")) ||
						(audio.DisplayTitle?.toLocaleLowerCase().includes(
							"dolby digital",
						) &&
							!audio.DisplayTitle?.toLocaleLowerCase().includes(
								"dolby digital+",
							)),
				);
				const checkDDP = audios.filter(
					(audio) =>
						audio.DisplayTitle?.toLocaleLowerCase().includes("ddp") ||
						audio.DisplayTitle?.toLocaleLowerCase().includes("dolby digital+"),
				);
				const checkDts = audios.filter(
					(audio) =>
						audio.DisplayTitle?.toLocaleLowerCase().includes("dts") &&
						!audio.DisplayTitle?.toLocaleLowerCase().includes("dts-hd ma") &&
						!audio.DisplayTitle?.toLocaleLowerCase().includes("dts-hd.ma"),
				);
				const checkDtsHDMA = audios.filter(
					(audio) =>
						audio.DisplayTitle?.toLocaleLowerCase().includes("dts-hd ma") ||
						audio.DisplayTitle?.toLocaleLowerCase().includes("dts-hd.ma"),
				);
				const checkUHD = videos.filter(
					(video) =>
						video.DisplayTitle?.toLocaleLowerCase().includes("4k") ||
						video.DisplayTitle?.toLocaleLowerCase().includes("2160p") ||
						video.DisplayTitle?.toLocaleLowerCase().includes("uhd"),
				);
				const checkHD = videos.filter(
					(video) =>
						(video.DisplayTitle?.toLocaleLowerCase().includes("hd") &&
							!video.DisplayTitle?.toLocaleLowerCase().includes("hdr")) ||
						video.DisplayTitle?.toLocaleLowerCase().includes("1080p") ||
						video.DisplayTitle?.toLocaleLowerCase().includes("fhd"),
				);
				const checkSD = videos.filter(
					(video) =>
						(video.DisplayTitle?.toLocaleLowerCase().includes("sd") &&
							!video.DisplayTitle?.toLocaleLowerCase().includes("sdr")) ||
						video.DisplayTitle?.toLocaleLowerCase().includes("720p"),
				);
				const checkSDR = videos.filter(
					(video) => video.VideoRangeType === "SDR",
				);
				const checkHDR = videos.filter(
					(video) =>
						video.VideoRange === "HDR" ||
						video.DisplayTitle?.toLocaleLowerCase().includes("dv"),
				);
				const checkHDR10 = videos.filter(
					(video) =>
						video.VideoRangeType === "HDR10" &&
						!video.DisplayTitle?.toLocaleLowerCase().includes("hdr10+"),
				);
				const checkHDR10Plus = videos.filter(
					(video) =>
						video.VideoRangeType === "HDR10+" ||
						video.DisplayTitle?.toLocaleLowerCase().includes("hdr10+"),
				);
				const checkTrueHD = audios.filter((audio) =>
					audio.DisplayTitle?.toLocaleLowerCase().includes("truehd"),
				);
				const checkIMAX = videos.filter((video) =>
					video.DisplayTitle?.toLocaleLowerCase().includes("imax"),
				);
				setMediaQualityInfo({
					isAtmos: checkAtmos.length > 0,
					isDolbyVision: checkDolbyVision.length > 0,
					isDts: checkDts.length > 0,
					isDtsHDMA: checkDtsHDMA.length > 0,
					isDD: checkDD.length > 0,
					isDDP: checkDDP.length > 0,
					isUHD: checkUHD.length > 0,
					isHD: checkHD.length > 0,
					isSD: checkSD.length > 0,
					isSDR: checkSDR.length > 0,
					isHDR: checkHDR.length > 0,
					isHDR10: checkHDR10.length > 0,
					isHDR10Plus: checkHDR10Plus.length > 0,
					isTrueHD: checkTrueHD.length > 0,
					isIMAX: checkIMAX.length > 0,
				});
			}
		}
	}, [item.isSuccess]);

	const pageRef = useRef(null);
	const { scrollYProgress } = useScroll({
		layoutEffect: false,
		target: pageRef,
		offset: ["start start", "60vh start"],
	});
	const parallax = useParallax(scrollYProgress, 50);

	if (item.isPending || similarItems.isPending) {
		return <ItemSkeleton />;
	}

	if (item.isSuccess && similarItems.isSuccess) {
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
					duration: 0.35,
					ease: "easeInOut",
				}}
				className="scrollY padded-top flex flex-column item item-default"
				ref={pageRef}
			>
				<div className="item-hero">
					<div className="item-hero-backdrop-container">
						{item.data.BackdropImageTags?.length ? (
							<motion.img
								alt={item.data.Name}
								src={api.getItemImageUrl(item.data.Id, "Backdrop", {
									tag: item.data.BackdropImageTags[0],
								})}
								className="item-hero-backdrop"
								onLoad={(e) => {
									e.currentTarget.style.opacity = 1;
								}}
								style={{
									y: parallax,
								}}
							/>
						) : (
							<motion.img
								alt={item.data.Name}
								src={heroBg}
								className="item-hero-backdrop"
								onLoad={(e) => {
									e.currentTarget.style.opacity = 1;
								}}
								style={{
									y: parallax,
								}}
							/>
						)}
					</div>
					<div
						className="item-hero-image-container"
						style={{
							aspectRatio: item.data.PrimaryImageAspectRatio ?? 1,
						}}
					>
						{Object.keys(item.data.ImageTags).includes("Primary") ? (
							<>
								<Blurhash
									hash={
										item.data.ImageBlurHashes.Primary[
											item.data.ImageTags.Primary
										]
									}
									className="item-hero-image-blurhash"
								/>
								<img
									alt={item.data.Name}
									src={api.getItemImageUrl(item.data.Id, "Primary", {
										quality: 90,
										tag: item.data.ImageTags.Primary,
									})}
									onLoad={(e) => {
										e.currentTarget.style.opacity = 1;
									}}
									className="item-hero-image"
								/>
							</>
						) : (
							<div className="item-hero-image-icon">
								{getTypeIcon(item.data.Type)}
							</div>
						)}
					</div>
					<div className="item-hero-detail flex flex-column">
						{item.data.ImageTags?.Logo ? (
							<img
								alt={item.data.Name}
								src={api.getItemImageUrl(item.data.Id, "Logo", {
									quality: 90,
									fillWidth: 592,
									fillHeight: 592,
									tag: item.data.ImageTags.Logo,
								})}
								onLoad={(e) => {
									e.currentTarget.style.opacity = 1;
								}}
								className="item-hero-logo"
							/>
						) : (
							<Typography mb={2} fontWeight={200} variant="h2">
								{item.data.Name}
							</Typography>
						)}
						<Stack
							direction="row"
							gap={2}
							justifyItems="flex-start"
							alignItems="center"
						>
							{mediaQualityInfo?.isUHD && (
								<img
									src={ultraHdIcon}
									alt="ultra hd"
									className="item-hero-mediaInfo badge"
								/>
							)}
							{mediaQualityInfo?.isHD && (
								<img
									src={hdIcon}
									alt="hd"
									className="item-hero-mediaInfo badge"
								/>
							)}
							{mediaQualityInfo?.isSD && (
								<img
									src={sdIcon}
									alt="sd"
									className="item-hero-mediaInfo badge"
								/>
							)}
							{mediaQualityInfo?.isSDR && (
								<img
									src={sdrIcon}
									alt="sdr"
									className="item-hero-mediaInfo badge"
								/>
							)}
							{mediaQualityInfo?.isHDR &&
								!mediaQualityInfo?.isHDR10 &&
								!mediaQualityInfo?.isHDR10Plus && (
									<img
										src={hdrIcon}
										alt="hdr"
										className="item-hero-mediaInfo badge"
									/>
								)}
							{mediaQualityInfo?.isHDR10 && (
								<img
									src={hdr10Icon}
									alt="hdr10"
									className="item-hero-mediaInfo badge"
								/>
							)}
							{item.data.PremiereDate && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{item.data.ProductionYear ?? ""}
								</Typography>
							)}
							{item.data.OfficialRating && (
								<Chip
									variant="filled"
									size="small"
									label={item.data.OfficialRating}
								/>
							)}

							{item.data.CommunityRating && (
								<div
									style={{
										display: "flex",
										gap: "0.25em",
										alignItems: "center",
									}}
									className="hero-carousel-info-rating"
								>
									<div
										className="material-symbols-rounded fill"
										style={{
											// fontSize: "2.2em",
											color: yellow[400],
										}}
									>
										star
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle2"
									>
										{Math.round(item.data.CommunityRating * 10) / 10}
									</Typography>
								</div>
							)}
							{item.data.CriticRating && (
								<div
									style={{
										display: "flex",
										gap: "0.25em",
										alignItems: "center",
									}}
									className="hero-carousel-info-rating"
								>
									<div
										className="material-symbols-rounded fill"
										style={{
											color:
												item.data.CriticRating > 50 ? green[400] : red[400],
										}}
									>
										{item.data.CriticRating > 50 ? "thumb_up" : "thumb_down"}
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle2"
									>
										{item.data.CriticRating}
									</Typography>
								</div>
							)}

							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{getRuntime(item.data.RunTimeTicks)}
								</Typography>
							)}
							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{endsAt(
										item.data.RunTimeTicks -
											item.data.UserData.PlaybackPositionTicks,
									)}
								</Typography>
							)}
							<Typography variant="subtitle2" style={{ opacity: 0.8 }}>
								{item.data.Genres?.slice(0, 4).join(" / ")}
							</Typography>
						</Stack>
						{mediaQualityInfo && (
							<Stack
								direction="row"
								gap={2}
								justifyItems="flex-start"
								alignItems="center"
							>
								{mediaQualityInfo?.isHDR10Plus && (
									<img
										src={hdr10PlusIcon}
										alt="hdr10+"
										className="item-hero-mediaInfo"
									/>
								)}
								{mediaQualityInfo.isDts && (
									<img
										src={dtsIcon}
										alt="dts"
										className="item-hero-mediaInfo"
									/>
								)}
								{mediaQualityInfo.isDtsHDMA && (
									<img
										src={dtsHdMaIcon}
										alt="dts-hd ma"
										className="item-hero-mediaInfo"
									/>
								)}
								{mediaQualityInfo.isAtmos && mediaQualityInfo.isDolbyVision && (
									<img
										src={dolbyVisionAtmosIcon}
										alt="dolby vision atmos"
										className="item-hero-mediaInfo"
									/>
								)}
								{mediaQualityInfo.isAtmos &&
									!mediaQualityInfo.isDolbyVision && (
										<img
											src={dolbyAtmosIcon}
											alt="dolby atmos"
											className="item-hero-mediaInfo"
										/>
									)}
								{mediaQualityInfo.isDolbyVision &&
									!mediaQualityInfo.isAtmos && (
										<img
											src={dolbyVisionIcon}
											alt="dolby vision"
											className="item-hero-mediaInfo"
										/>
									)}
								{mediaQualityInfo.isTrueHD && (
									<img
										src={dolbyTrueHDIcon}
										alt="dolby truehd"
										className="item-hero-mediaInfo"
									/>
								)}
								{mediaQualityInfo.isDD && (
									<img
										src={dolbyDigitalIcon}
										alt="dolby digital"
										className="item-hero-mediaInfo"
									/>
								)}
								{mediaQualityInfo.isDDP && (
									<img
										src={dolbyDigitalPlusIcon}
										alt="dolby digital plus"
										className="item-hero-mediaInfo"
									/>
								)}
								{mediaQualityInfo.isIMAX && (
									<img
										src={imaxIcon}
										alt="imax"
										className="item-hero-mediaInfo"
									/>
								)}
							</Stack>
						)}
					</div>
					<div className="item-hero-buttons-container">
						<div
							className="flex flex-row"
							style={{
								width: "100%",
							}}
						>
							<PlayButton
								item={item.data}
								itemId={item.data.Id}
								itemType={item.data.Type}
								itemUserData={item.data.UserData}
								currentVideoTrack={selectedVideoTrack}
								currentAudioTrack={selectedAudioTrack}
								currentSubTrack={selectedSubtitleTrack}
								userId={user.data.Id}
								buttonProps={{
									fullWidth: true,
								}}
							/>
						</div>
						<div className="flex flex-row" style={{ gap: "1em" }}>
							<TrailerButton
								trailerItem={item.data.RemoteTrailers}
								disabled={item.data.RemoteTrailers?.length === 0}
							/>
							<LikeButton
								itemName={item.data.Name}
								itemId={item.data.Id}
								queryKey={["item", id]}
								isFavorite={item.data.UserData.IsFavorite}
								userId={user.data.Id}
							/>
							<MarkPlayedButton
								itemName={item.data.Name}
								itemId={item.data.Id}
								queryKey={["item", id]}
								isPlayed={item.data.UserData.Played}
								userId={user.data.Id}
							/>
						</div>
					</div>
				</div>
				<div className="item-detail">
					<div style={{ width: "100%" }}>
						{item.data.Taglines?.length > 0 && (
							<Typography variant="h5" mb={2} fontWeight={300}>
								{item.data.Taglines[0]}
							</Typography>
						)}
						<ShowMoreText
							content={item.data.Overview ?? ""}
							collapsedLines={4}
						/>
					</div>
					<div
						style={{
							width: "100%",
						}}
					>
						{videoTracks.length > 0 && (
							<TextField
								label="Video"
								select
								style={{
									width: "100%",
									marginBottom: "1em",
								}}
								value={selectedVideoTrack}
								variant="filled"
								onChange={(e) => setSelectedVideoTrack(e.target.value)}
							>
								{videoTracks.map((track) => (
									<MenuItem key={track.Index} value={track.Index}>
										{track.DisplayTitle}
									</MenuItem>
								))}
							</TextField>
						)}
						{audioTracks.length > 0 && (
							<TextField
								label="Audio"
								select
								style={{
									width: "100%",
									marginBottom: "1em",
								}}
								value={selectedAudioTrack}
								variant="filled"
								onChange={(e) => setSelectedAudioTrack(e.target.value)}
							>
								{audioTracks.map((track) => (
									<MenuItem key={track.Index} value={track.Index}>
										{track.DisplayTitle}
									</MenuItem>
								))}
							</TextField>
						)}
						{subtitleTracks.length > 0 && (
							<TextField
								label="Subtitle"
								select
								style={{
									width: "100%",
								}}
								value={selectedSubtitleTrack}
								variant="filled"
								SelectProps={{
									MenuProps: {
										disablePortal: true,
									},
								}}
								onChange={(e) => setSelectedSubtitleTrack(e.target.value)}
							>
								<MenuItem key={-1} value={"nosub"}>
									No Subtitle
								</MenuItem>
								{subtitleTracks.map((track) => (
									<MenuItem key={track.Index} value={track.Index}>
										{track.DisplayTitle}
									</MenuItem>
								))}
							</TextField>
						)}
						<div
							style={{
								display: "flex",
								gap: "0.6em",
								alignSelf: "end",
								marginTop: "1em",
							}}
						>
							{item.data.ExternalUrls.map((url) => (
								<IconLink url={url.Url} name={url.Name} />
							))}
						</div>
					</div>
				</div>
				{item.data.People.length > 0 && (
					<div className="item-detail-cast">
						<Typography variant="h5" mb={2}>
							Cast & Crew
						</Typography>
						{actors.length > 0 && (
							<div className="item-detail-cast-container">
								<Typography variant="h6">Actors</Typography>
								<div className="item-detail-cast-grid">
									{actors.map((actor) => (
										<Link
											className="item-detail-cast-card"
											key={actor.Id}
											to="/person/$id"
											params={{
												id: actor.Id,
											}}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name}
													src={api.getItemImageUrl(actor.Id, "Primary", {
														quality: 80,
														fillWidth: 200,
														fillHeight: 200,
													})}
													className="item-detail-cast-card-image"
												/>
											) : (
												<div className="item-detail-cast-card-icon">
													{getTypeIcon("Person")}
												</div>
											)}
											<div className="item-detail-cast-card-text">
												<Typography variant="subtitle1">
													{actor.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													style={{
														opacity: 0.5,
													}}
												>
													{actor.Role}
												</Typography>
											</div>
										</Link>
									))}
								</div>
							</div>
						)}
						{writers.length > 0 && (
							<div className="item-detail-cast-container">
								<Typography variant="h6">Writers</Typography>
								<div className="item-detail-cast-grid">
									{writers.map((actor) => (
										<Link
											className="item-detail-cast-card"
											key={actor.Id}
											to={`/person/${actor.Id}`}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name}
													src={api.getItemImageUrl(actor.Id, "Primary", {
														quality: 80,
														fillWidth: 200,
														fillHeight: 200,
													})}
													className="item-detail-cast-card-image"
												/>
											) : (
												<div className="item-detail-cast-card-icon">
													{getTypeIcon("Person")}
												</div>
											)}
											<div className="item-detail-cast-card-text">
												<Typography variant="subtitle1">
													{actor.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													style={{
														opacity: 0.5,
													}}
												>
													{actor.Role}
												</Typography>
											</div>
										</Link>
									))}
								</div>
							</div>
						)}
						{directors.length > 0 && (
							<div className="item-detail-cast-container">
								<Typography variant="h6">Directors</Typography>
								<div className="item-detail-cast-grid">
									{directors.map((actor) => (
										<Link
											className="item-detail-cast-card"
											to="/person/$id"
											key={actor.Id}
											params={{
												id: actor.Id,
											}}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name}
													src={api.getItemImageUrl(actor.Id, "Primary", {
														quality: 80,
														fillWidth: 200,
														fillHeight: 200,
													})}
													className="item-detail-cast-card-image"
												/>
											) : (
												<div className="item-detail-cast-card-icon">
													{getTypeIcon("Person")}
												</div>
											)}
											<div className="item-detail-cast-card-text">
												<Typography variant="subtitle1">
													{actor.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													style={{
														opacity: 0.5,
													}}
												>
													{actor.Role}
												</Typography>
											</div>
										</Link>
									))}
								</div>
							</div>
						)}
						{producers.length > 0 && (
							<div className="item-detail-cast-container">
								<Typography variant="h6">Producers</Typography>
								<div className="item-detail-cast-grid">
									{producers.map((actor) => (
										<Link
											className="item-detail-cast-card"
											key={actor.Id}
											to={`/person/$id`}
											params={{
												id: actor.Id,
											}}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name}
													src={api.getItemImageUrl(actor.Id, "Primary", {
														quality: 80,
														fillWidth: 200,
														fillHeight: 200,
													})}
													className="item-detail-cast-card-image"
												/>
											) : (
												<div className="item-detail-cast-card-icon">
													{getTypeIcon("Person")}
												</div>
											)}
											<div className="item-detail-cast-card-text">
												<Typography variant="subtitle1">
													{actor.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													style={{
														opacity: 0.5,
													}}
												>
													{actor.Role}
												</Typography>
											</div>
										</Link>
									))}
								</div>
							</div>
						)}
					</div>
				)}
				{similarItems.data.TotalRecordCount > 0 && (
					<CardScroller
						title="You might also like"
						displayCards={7}
						disableDecoration
					>
						{similarItems.data.Items.map((similar) => {
							return (
								<Card
									key={similar.Id}
									item={similar}
									seriesId={similar.SeriesId}
									cardTitle={
										similar.Type === BaseItemKind.Episode
											? similar.SeriesName
											: similar.Name
									}
									imageType={"Primary"}
									cardCaption={
										similar.Type === BaseItemKind.Episode
											? `S${similar.ParentIndexNumber}:E${similar.IndexNumber} - ${similar.Name}`
											: similar.Type === BaseItemKind.Series
												? `${similar.ProductionYear} - ${
														similar.EndDate
															? new Date(similar.EndDate).toLocaleString([], {
																	year: "numeric",
																})
															: "Present"
													}`
												: similar.ProductionYear
									}
									cardType={
										similar.Type === BaseItemKind.MusicAlbum ||
										similar.Type === BaseItemKind.Audio
											? "square"
											: "portrait"
									}
									queryKey={["item", id, "similarItem"]}
									userId={user.data.Id}
									imageBlurhash={
										!!similar.ImageBlurHashes?.Primary &&
										similar.ImageBlurHashes?.Primary[
											Object.keys(similar.ImageBlurHashes.Primary)[0]
										]
									}
								/>
							);
						})}
					</CardScroller>
				)}
			</motion.div>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
}

export default ItemDetail;
