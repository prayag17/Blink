import React, { useState, useRef, useMemo, useEffect } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
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
	MediaStreamType,
} from "@jellyfin/sdk/lib/generated-client";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { useQuery } from "@tanstack/react-query";

import heroBg from "@/assets/herobg.png";

import LikeButton from "@/components/buttons/likeButton";
import MarkPlayedButton from "@/components/buttons/markPlayedButton";
import PlayButton from "@/components/buttons/playButton";
import TrailerButton from "@/components/buttons/trailerButton";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ShowMoreText from "@/components/showMoreText";
import { getTypeIcon } from "@/components/utils/iconsCollection";
import { endsAt, getRuntime } from "@/utils/date/time";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./episode.scss";

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

import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import IconLink from "@/components/iconLink";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useCentralStore } from "@/utils/store/central";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_api/episode/$id")({
	component: EpisodeTitlePage,
});

function EpisodeTitlePage() {
	const { id } = Route.useParams();
	const api = Route.useRouteContext().api;

	const user = useCentralStore((s) => s.currentUser);

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			if (!api) return null;
			const result = await getUserLibraryApi(api).getItem({
				userId: user?.Id,
				itemId: id,
			});
			return result.data;
		},
		enabled: !!user?.Id,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const upcomingEpisodes = useQuery({
		queryKey: ["item", id, "episode", "upcomingEpisodes"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				parentId: item.data?.ParentId ?? "",
				startIndex: item.data?.IndexNumber ?? 0,
				excludeLocationTypes: ["Virtual"],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.Episode,
		networkMode: "always",
	});

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	const [selectedVideoTrack, setSelectedVideoTrack] = useState(0);
	const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
	const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(0);

	const videoTracks = useMemo(() => {
		const result = item.data?.MediaStreams?.filter((source) => {
			if (source.Type === MediaStreamType.Video) {
				return true;
			}
			return false;
		});
		setSelectedVideoTrack(result?.find((track) => track.IsDefault)?.Index ?? 0);
		return result ?? [];
	}, [item.data?.Id]);
	const audioTracks = useMemo(() => {
		const result = item.data?.MediaStreams?.filter((source) => {
			if (source.Type === MediaStreamType.Audio) {
				return true;
			}
			return false;
		});
		setSelectedAudioTrack(result?.find((track) => track.IsDefault)?.Index ?? 0);
		return result ?? [];
	}, [item.data?.Id]);
	const subtitleTracks = useMemo(() => {
		const result = item.data?.MediaStreams?.filter((source) => {
			if (source.Type === MediaStreamType.Subtitle) {
				return true;
			}
			return false;
		});
		setSelectedSubtitleTrack(
			result?.find((track) => track.IsDefault)?.Index ?? -1,
		);
		return result ?? [];
	}, [item.data?.Id]);

	const directors = useMemo(() => {
		return item.data?.People?.filter((itm) => itm.Type === "Director") ?? [];
	}, [item.data?.Id]);
	const writers = useMemo(() => {
		return item.data?.People?.filter((itm) => itm.Type === "Writer") ?? [];
	}, [item.data?.Id]);
	const actors = useMemo(() => {
		return item.data?.People?.filter((itm) => itm.Type === "Actor") ?? [];
	}, [item.data?.Id]);
	const producers = useMemo(() => {
		return item.data?.People?.filter((itm) => itm.Type === "Producer") ?? [];
	}, [item.data?.Id]);


	const mediaQualityInfo = useMemo<MediaQualityInfo>(() => {
		const checkAtmos = audioTracks.filter((audio) =>
			audio.DisplayTitle?.toLocaleLowerCase().includes("atmos"),
		);
		const checkDolbyVision = videoTracks.filter(
			(video) =>
				video.DisplayTitle?.toLocaleLowerCase().includes("dv") ||
				video.DisplayTitle?.toLocaleLowerCase().includes("dolby vision") ||
				!!video.VideoDoViTitle ||
				video.VideoRangeType === "DOVI",
		);
		const checkDD = audioTracks.filter(
			(audio) =>
				(audio.DisplayTitle?.toLocaleLowerCase().includes("dd") &&
					!audio.DisplayTitle?.toLocaleLowerCase().includes("ddp")) ||
				(audio.DisplayTitle?.toLocaleLowerCase().includes("dolby digital") &&
					!audio.DisplayTitle?.toLocaleLowerCase().includes("dolby digital+")),
		);
		const checkDDP = audioTracks.filter(
			(audio) =>
				audio.DisplayTitle?.toLocaleLowerCase().includes("ddp") ||
				audio.DisplayTitle?.toLocaleLowerCase().includes("dolby digital+"),
		);
		const checkDts = audioTracks.filter(
			(audio) =>
				audio.DisplayTitle?.toLocaleLowerCase().includes("dts") &&
				!audio.DisplayTitle?.toLocaleLowerCase().includes("dts-hd ma") &&
				!audio.DisplayTitle?.toLocaleLowerCase().includes("dts-hd.ma"),
		);
		const checkDtsHDMA = audioTracks.filter(
			(audio) =>
				audio.DisplayTitle?.toLocaleLowerCase().includes("dts-hd ma") ||
				audio.DisplayTitle?.toLocaleLowerCase().includes("dts-hd.ma"),
		);
		const checkUHD = videoTracks.filter(
			(video) =>
				video.DisplayTitle?.toLocaleLowerCase().includes("4k") ||
				video.DisplayTitle?.toLocaleLowerCase().includes("2160p") ||
				video.DisplayTitle?.toLocaleLowerCase().includes("uhd"),
		);
		const checkHD = videoTracks.filter(
			(video) =>
				(video.DisplayTitle?.toLocaleLowerCase().includes("hd") &&
					!video.DisplayTitle?.toLocaleLowerCase().includes("hdr")) ||
				video.DisplayTitle?.toLocaleLowerCase().includes("1080p") ||
				video.DisplayTitle?.toLocaleLowerCase().includes("fhd"),
		);
		const checkSD = videoTracks.filter(
			(video) =>
				(video.DisplayTitle?.toLocaleLowerCase().includes("sd") &&
					!video.DisplayTitle?.toLocaleLowerCase().includes("sdr")) ||
				video.DisplayTitle?.toLocaleLowerCase().includes("720p"),
		);
		const checkSDR = videoTracks.filter(
			(video) => video.VideoRangeType === "SDR",
		);
		const checkHDR = videoTracks.filter(
			(video) =>
				video.VideoRange === "HDR" ||
				video.DisplayTitle?.toLocaleLowerCase().includes("dv"),
		);
		const checkHDR10 = videoTracks.filter(
			(video) =>
				video.VideoRangeType === "HDR10" &&
				!video.DisplayTitle?.toLocaleLowerCase().includes("hdr10+"),
		);
		const checkHDR10Plus = videoTracks.filter(
			(video) =>
				video.VideoRangeType === "HDR10Plus" ||
				video.DisplayTitle?.toLocaleLowerCase().includes("hdr10+"),
		);
		const checkTrueHD = audioTracks.filter((audio) =>
			audio.DisplayTitle?.toLocaleLowerCase().includes("truehd"),
		);
		const checkIMAX = videoTracks.filter((video) =>
			video.DisplayTitle?.toLocaleLowerCase().includes("imax"),
		);
		return {
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
		};
	}, [item.data?.Id]);

	useEffect(() => {
		if (api && item.isSuccess && item.data) {
			setAppBackdrop(
				`${api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`,
				item.data.Id,
			);
		}
	}, [item.isSuccess]);

	const pageRef = useRef(null);
	const { scrollYProgress } = useScroll({
		target: pageRef,
		offset: ["start start", "60vh start"],
		layoutEffect: false,
	});
	const parallax = useParallax(scrollYProgress, 50);

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
	if (item.isSuccess && item.data) {
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
				className="scrollY padded-top flex flex-column item item-episode"
				ref={pageRef}
			>
				<div className="item-hero">
					<div className="item-hero-backdrop-container">
						{item.data.ParentBackdropImageTags?.length ? (
							<motion.img
								alt={item.data.Name ?? ""}
								src={
									api &&
									getImageUrlsApi(api).getItemImageUrlById(
										item.data.ParentBackdropItemId ?? "",
										"Backdrop",
										{
											tag: item.data.ParentBackdropImageTags[0],
										},
									)
								}
								className="item-hero-backdrop"
								onLoad={(e) => {
									e.currentTarget.style.opacity = "1";
								}}
								style={{
									y: parallax,
								}}
							/>
						) : (
							<motion.img
								alt={item.data.Name ?? ""}
								src={heroBg}
								className="item-hero-backdrop"
								onLoad={(e) => {
									e.currentTarget.style.opacity = "1";
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
						{item.data.ImageTags?.Primary ? (
							<div>
								<Blurhash
									hash={
										item.data.ImageBlurHashes?.Primary?.[
											item.data.ImageTags.Primary
										] ?? ""
									}
									className="item-hero-image-blurhash"
								/>
								<img
									alt={item.data.Name ?? ""}
									src={
										api &&
										getImageUrlsApi(api).getItemImageUrlById(
											item.data.Id ?? "",
											"Primary",
											{
												quality: 90,
												tag: item.data.ImageTags.Primary,
											},
										)
									}
									onLoad={(e) => {
										e.currentTarget.style.opacity = "1";
									}}
									className="item-hero-image"
								/>
							</div>
						) : (
							<div className="item-hero-image-icon">
								{getTypeIcon(item.data.Type ?? "Episode")}
							</div>
						)}
					</div>
					<div className="item-hero-detail">
						<Typography
							variant="h2"
							fontWeight="200"
							mb={2}
							style={{
								textDecoration: "none",
							}}
						>
							<Link
								style={{ textDecoration: "none", color: "white" }}
								to="/series/$id"
								params={{ id: item.data.SeriesId ?? "" }}
							>
								{item.data.ParentLogoItemId ? (
									<img
										alt={item.data.SeriesName ?? ""}
										src={
											api &&
											getImageUrlsApi(api).getItemImageUrlById(
												item.data.ParentLogoItemId,
												"Logo",
												{
													quality: 90,
													fillWidth: 592,
													fillHeight: 592,
												},
											)
										}
										onLoad={(e) => {
											e.currentTarget.style.opacity = "1";
										}}
										className="item-hero-logo"
									/>
								) : (
									item.data.SeriesName
								)}
							</Link>
						</Typography>
						<Typography variant="h4" fontWeight={300} mb={2}>
							S{item.data.ParentIndexNumber ?? 0}:E
							{item.data.IndexNumberEnd
								? `${item.data.IndexNumber ?? 0} / ${
										item.data.IndexNumberEnd ?? 0
									}`
								: `${item.data.IndexNumber ?? 0}`}{" "}
							{item.data.Name}
						</Typography>

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
											(item.data.UserData?.PlaybackPositionTicks ?? 0),
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
						<div className="flex flex-row">
							<PlayButton
								item={item.data}
								itemType="Episode"
								currentVideoTrack={selectedVideoTrack ?? 0}
								currentAudioTrack={selectedAudioTrack ?? 0}
								currentSubTrack={selectedSubtitleTrack ?? "nosub"}
								userId={user?.Id}
							/>
						</div>
						<div className="flex flex-row" style={{ gap: "1em" }}>
							{item.data.RemoteTrailers && (
								<TrailerButton
									trailerItem={item.data.RemoteTrailers}
									disabled={item.data.RemoteTrailers?.length === 0}
								/>
							)}
							<LikeButton
								itemName={item.data.Name}
								itemId={item.data.Id}
								queryKey={["item", id]}
								isFavorite={item.data.UserData?.IsFavorite}
								userId={user?.Id}
							/>
							<MarkPlayedButton
								itemName={item.data.Name}
								itemId={item.data.Id}
								queryKey={["item", id]}
								isPlayed={item.data.UserData?.Played}
								userId={user?.Id}
							/>
						</div>
					</div>
				</div>
				<div className="item-detail">
					<div className="fullWidth">
						<ShowMoreText
							content={item.data.Overview ?? ""}
							collapsedLines={4}
						/>
					</div>
					<div className="fullWidth">
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
								onChange={(e) => setSelectedVideoTrack(Number(e.target.value))}
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
								onChange={(e) => setSelectedAudioTrack(Number(e.target.value))}
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
								onChange={(e) =>
									setSelectedSubtitleTrack(Number(e.target.value))
								}
							>
								<MenuItem key={-1} value={-1}>
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
							{item.data.ExternalUrls?.map((url) => (
								<IconLink
									key={url.Url}
									url={url.Url ?? ""}
									name={url.Name ?? ""}
								/>
							))}
						</div>
					</div>
				</div>

				{(item.data.People?.length ?? 0) > 0 && (
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
												id: actor.Id ?? "",
											}}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name ?? ""}
													src={
														api &&
														getImageUrlsApi(api).getItemImageUrlById(
															actor.Id ?? "",
															"Primary",
															{
																quality: 80,
																fillWidth: 200,
																fillHeight: 200,
															},
														)
													}
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
											to="/person/$id"
											params={{
												id: actor.Id ?? "",
											}}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name ?? ""}
													src={
														api &&
														getImageUrlsApi(api).getItemImageUrlById(
															actor.Id ?? "",
															"Primary",
															{
																quality: 80,
																fillWidth: 200,
																fillHeight: 200,
															},
														)
													}
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
											key={actor.Id}
											to="/person/$id"
											params={{
												id: actor.Id ?? "",
											}}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name ?? ""}
													src={
														api &&
														getImageUrlsApi(api).getItemImageUrlById(
															actor.Id ?? "",
															"Primary",
															{
																quality: 80,
																fillWidth: 200,
																fillHeight: 200,
															},
														)
													}
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
											to="/person/$id"
											params={{
												id: actor.Id ?? "",
											}}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name ?? ""}
													src={
														api &&
														getImageUrlsApi(api).getItemImageUrlById(
															actor.Id ?? "",
															"Primary",
															{
																quality: 80,
																fillWidth: 200,
																fillHeight: 200,
															},
														)
													}
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

				{upcomingEpisodes.isSuccess &&
					(upcomingEpisodes.data?.Items?.length ?? 0) > 0 && (
						<CardScroller
							title="Upcoming Episodes"
							displayCards={4}
							disableDecoration
						>
							{upcomingEpisodes.data?.Items?.map((episode) => {
								return (
									<Card
										key={episode.Id}
										item={episode}
										cardTitle={episode.SeriesName}
										imageType="Primary"
										cardCaption={`S${episode.ParentIndexNumber}:E${episode.IndexNumber} - ${episode.Name}`}
										cardType="thumb"
										queryKey={["item", id, "episode", "upcomingEpisodes"]}
										userId={user?.Id}
									/>
								);
							})}
						</CardScroller>
					)}
			</motion.div>
		);
	}
	if (item.isError) {
		return <ErrorNotice />;
	}
}

export default EpisodeTitlePage;
