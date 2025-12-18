import {
	BaseItemKind,
	MediaStreamType,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import ItemHeader from "@/components/itemHeader";

import "./item.scss";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useShallow } from "zustand/shallow";
import LikeButton from "@/components/buttons/likeButton";
import MarkPlayedButton from "@/components/buttons/markPlayedButton";
import PlayButton from "@/components/buttons/playButton";
import TrailerButton from "@/components/buttons/trailerButton";
import IconLink from "@/components/iconLink";
import ShowMoreText from "@/components/showMoreText";
import ItemSkeleton from "@/components/skeleton/item";
import { getTypeIcon } from "@/components/utils/iconsCollection";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { getItemQueryOptions } from "@/utils/queries/items";
import { useBackdropStore } from "@/utils/store/backdrop";
import { useCentralStore } from "@/utils/store/central";
import type MediaQualityInfo from "@/utils/types/mediaQualityInfo";

export const Route = createFileRoute("/_api/item/$id")({
	component: ItemDetail,
	pendingComponent: () => <ItemSkeleton />,
	// pendingMs: 5000,
	loader: async ({ context: { queryClient, api, user }, params }) => {
		if (!api || !user?.Id) return null;
		const itemPromise = queryClient.ensureQueryData(
			getItemQueryOptions(params.id, api, user?.Id),
		);
		queryClient.prefetchQuery({
			queryKey: ["item", params.id, "similarItem"],
			queryFn: async () =>
				(
					await getLibraryApi(api).getSimilarItems({
						userId: user?.Id,
						itemId: params.id,
						limit: 16,
					})
				).data,
		});
		await itemPromise;
	},
});

function ItemDetail() {
	const { id } = Route.useParams();

	const api = Route.useRouteContext().api;

	const user = useCentralStore((s) => s.currentUser);

	const item = useSuspenseQuery(getItemQueryOptions(id, api, user?.Id));

	const similarItems = useQuery({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			if (!api || !user?.Id) return null;
			return (
				await getLibraryApi(api).getSimilarItems({
					userId: user?.Id,
					itemId: id,
					limit: 16,
				})
			).data;
		},
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

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
		setSelectedVideoTrack(
			result?.find((track) => track.IsDefault)?.Index ??
				result?.[0]?.Index ??
				0,
		);
		return result ?? [];
	}, [item.data?.Id]);
	const audioTracks = useMemo(() => {
		const result = item.data?.MediaStreams?.filter((source) => {
			if (source.Type === MediaStreamType.Audio) {
				return true;
			}
			return false;
		});
		setSelectedAudioTrack(item.data.MediaSources?.[0].DefaultAudioStreamIndex ?? 0);
		return result ?? [];
	}, [item.data?.Id]);
	const subtitleTracks = useMemo(() => {
		const result = item.data.MediaStreams?.filter((source) => {
			if (source.Type === MediaStreamType.Subtitle) {
				return true;
			}
			return false;
		});
		setSelectedSubtitleTrack(
			item.data.MediaSources?.[0].DefaultSubtitleStreamIndex ?? -1,
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

	const setBackdrop = useBackdropStore(useShallow((state) => state.setBackdrop));

	useLayoutEffect(() => {
		if (api && item.data) {
			if (item.data?.BackdropImageTags?.length) {
				setBackdrop(
					item.data.ImageBlurHashes?.Backdrop?.[
						item.data.BackdropImageTags?.[0]
					],
				);
			} else {
				setBackdrop("");
			}
		}
	}, [item.data.Id]);

	// Provide a scroll target ref to the backdrop component.
	const scrollTargetRef = useRef<HTMLDivElement | null>(null);

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
				ref={scrollTargetRef}
			>
				<ItemHeader
					item={item.data}
					api={api}
					mediaQualityInfo={mediaQualityInfo}
					scrollTargetRef={scrollTargetRef}
				>
					<div className="item-hero-buttons-container">
						<div
							className="flex flex-row"
							style={{
								width: "100%",
							}}
						>
							<PlayButton
								item={item.data}
								itemType={item.data.Type ?? "Movie"}
								audio={item.data.Type === "Audio"}
								currentVideoTrack={selectedVideoTrack}
								currentAudioTrack={selectedAudioTrack}
								currentSubTrack={selectedSubtitleTrack}
								userId={user?.Id}
								buttonProps={{
									fullWidth: true,
								}}
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
				</ItemHeader>
				<div className="item-detail">
					<div style={{ width: "100%" }}>
						{(item.data.Taglines?.length ?? 0) > 0 && (
							<Typography variant="h5" mb={2} fontWeight={300}>
								{item.data.Taglines?.[0]}
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
								SelectProps={{
									MenuProps: {
										disablePortal: true,
									},
								}}
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
							{item.data.ExternalUrls?.map(
								(url) =>
									url.Url &&
									url.Name && (
										<IconLink key={url.Name} url={url.Url} name={url.Name} />
									),
							)}
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
											to="/person/$id"
											key={actor.Id}
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
				{(similarItems.data?.TotalRecordCount ?? 0) > 0 && (
					<CardScroller
						title="You might also like"
						displayCards={7}
						disableDecoration
					>
						{similarItems.data?.Items?.map((similar) => {
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
									userId={user?.Id}
								/>
							);
						})}
					</CardScroller>
				)}
			</motion.div>
		);
}

export default ItemDetail;
