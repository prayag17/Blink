/** @format */

import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import "./home.module.scss";

import Carousel from "../../components/carousel";

// Custom Components
import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";
import { LatestMediaSection } from "../../components/layouts/homeSection/latestMediaSection";
import { CarouselSkeleton } from "../../components/skeleton/carousel";
import { CardsSkeleton } from "../../components/skeleton/cards";

import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import { useNavigate } from "react-router-dom";

import { useBackdropStore } from "../../utils/store/backdrop";

import CarouselSlide from "../../components/carouselSlide";
import { BaseItemKind, ItemFields } from "@jellyfin/sdk/lib/generated-client";
import ErrorBoundary from "../../components/errorBoundary";
import Typography from "@mui/material/Typography";
import CarouselSlideError from "../../components/errors/carousel";
import { useApi } from "../../utils/store/api";

const Home = () => {
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

	const libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			const libs = await getUserViewsApi(api).getUserViews({
				userId: user.data.Id,
			});
			return libs.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const latestMedia = useQuery({
		queryKey: ["home", "latestMedia"],
		queryFn: async () => {
			const media = await getUserLibraryApi(api).getLatestMedia({
				userId: user.data.Id,
				fields: [
					ItemFields.Overview,
					ItemFields.ParentId,
					"ParentIndexNumber",
					ItemFields.SeasonUserData,
					ItemFields.IsHd,
					ItemFields.MediaStreams,
					ItemFields.MediaSources,
				],
				enableUserData: true,
				enableImages: true,
			});
			return media.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const resumeItemsVideo = useQuery({
		queryKey: ["home", "resume", "video"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(api).getResumeItems({
				userId: user.data.Id,
				limit: 10,
				mediaTypes: ["Video"],
				enableUserData: true,
				fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
			});
			return resumeItems.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const resumeItemsAudio = useQuery({
		queryKey: ["home", "resume", "audio"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(api).getResumeItems({
				userId: user.data.Id,
				limit: 10,
				mediaTypes: ["Audio"],
				enableUserData: true,
				fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
			});
			return resumeItems.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const upNextItems = useQuery({
		queryKey: ["home", "upNext"],
		queryFn: async () => {
			const upNext = await getTvShowsApi(api).getNextUp({
				userId: user.data.Id,
				fields: [
					ItemFields.PrimaryImageAspectRatio,
					ItemFields.MediaStreams,
					ItemFields.MediaSources,
					ItemFields.ParentId,
					"IndexNumber",
					"ParentIndexNumber",
				],
				limit: 10,
			});
			return upNext.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const [latestMediaLibs, setLatestMediaLibs] = useState([]);

	const navigate = useNavigate();

	const excludeTypes = ["boxsets", "playlists", "livetv", "channels"];

	let tempData = [];
	if (libraries.status == "success") {
		libraries.data.Items.map((lib) => {
			if (excludeTypes.includes(lib.CollectionType)) {
				return;
			}
			tempData = latestMediaLibs;
			if (
				!tempData.some(
					(el) =>
						JSON.stringify(el) ==
						JSON.stringify([lib.Id, lib.Name]),
				)
			) {
				tempData.push([lib.Id, lib.Name]);
				setLatestMediaLibs(tempData);
			}
		});
	}

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	if (user.isPaused) {
		user.refetch();
		console.log(user.isError);
	}

	return (
		<>
			<main
				className="scrollY home"
				style={{
					flexGrow: 1,
					// paddingBottom: "3em",
					position: "relative",
				}}
			>
				<ErrorBoundary fallback={<CarouselSlideError />}>
					{latestMedia.isLoading ? (
						<CarouselSkeleton />
					) : (
						<Carousel
							content={latestMedia.data?.map((item) => (
								<CarouselSlide
									item={item}
									key={item.Id}
								/>
							))}
							onChange={(now) => {
								if (latestMedia.isSuccess) {
									if (
										latestMedia.data[now]
											.ParentBackdropImageTags
									) {
										setAppBackdrop(
											`${api.basePath}/Items/${latestMedia.data[now].ParentBackdropItemId}/Images/Backdrop`,
											latestMedia.data[now].Id,
										);
									} else {
										setAppBackdrop(
											`${api.basePath}/Items/${latestMedia.data[now].Id}/Images/Backdrop`,
											latestMedia.data[now].Id,
										);
									}
								}
							}}
						/>
					)}
				</ErrorBoundary>

				<div
					className="padded-container"
					style={{
						padding: "1em",
					}}
				>
					<ErrorBoundary
						fallback={
							<div className="error">
								<Typography>
									Error with Carousel
								</Typography>
							</div>
						}
					>
						{libraries.isLoading ? (
							<CardsSkeleton />
						) : (
							<CardScroller
								displayCards={4}
								title="Libraries"
							>
								{libraries.status == "success" &&
									libraries.data.Items.map(
										(item) => {
											return (
												<Card
													key={item.Id}
													item={item}
													cardTitle={
														item.Name
													}
													imageType="Primary"
													cardType="thumb"
													disableOverlay
													onClick={() =>
														navigate(
															`/library/${item.Id}`,
														)
													}
													imageBlurhash={
														!!item
															.ImageBlurHashes
															?.Primary &&
														item
															.ImageBlurHashes
															?.Primary[
															Object.keys(
																item
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
					</ErrorBoundary>
					<ErrorBoundary
						fallback={
							<div className="error">
								<Typography>
									Error with Libraries
								</Typography>
							</div>
						}
					>
						{upNextItems.isLoading ? (
							<CardsSkeleton />
						) : upNextItems.isSuccess &&
						  upNextItems.data.Items.length == 0 ? (
							<></>
						) : (
							<CardScroller
								displayCards={4}
								title="Up Next"
							>
								{upNextItems.data.Items.map((item) => {
									return (
										<Card
											key={item.Id}
											item={item}
											cardTitle={
												item.Type ==
												BaseItemKind.Episode
													? item.SeriesName
													: item.Name
											}
											imageType={
												item.Type ==
												BaseItemKind.Episode
													? "Primary"
													: Object.keys(
															item.ImageTags,
													  ).includes(
															"Thumb",
													  )
													? "Thumb"
													: "Backdrop"
											}
											cardCaption={
												item.Type ==
												BaseItemKind.Episode
													? item.ParentIndexNumber ==
													  0
														? `${item.SeasonName} - ${item.Name}`
														: item.IndexNumberEnd
														? `${item.IndexNumber}-${item.IndexNumberEnd}. ${item.Name}`
														: `${item.IndexNumber}. ${item.Name}`
													: item.Type ==
													  BaseItemKind.Series
													? `${
															item.ProductionYear
													  } - ${
															item.EndDate
																? new Date(
																		item.EndDate,
																  ).toLocaleString(
																		[],
																		{
																			year: "numeric",
																		},
																  )
																: "Present"
													  }`
													: item.ProductionYear
											}
											cardType="thumb"
											queryKey={[
												"home",
												"upNext",
											]}
											userId={user.data.Id}
											imageBlurhash={
												!!item
													.ImageBlurHashes
													?.Primary &&
												item.ImageBlurHashes
													?.Primary[
													Object.keys(
														item
															.ImageBlurHashes
															.Primary,
													)[0]
												]
											}
										></Card>
									);
								})}
							</CardScroller>
						)}
					</ErrorBoundary>
					<ErrorBoundary
						fallback={
							<div className="error">
								<Typography>
									Error with resumeItemsVideo
								</Typography>
							</div>
						}
					>
						{resumeItemsVideo.isLoading ? (
							<CardsSkeleton />
						) : resumeItemsVideo.isSuccess &&
						  resumeItemsVideo.data.Items.length == 0 ? (
							<></>
						) : (
							<CardScroller
								displayCards={4}
								title="Continue Watching"
							>
								{resumeItemsVideo.data.Items.map(
									(item) => {
										return (
											<Card
												key={item.Id}
												item={item}
												cardTitle={
													item.Type ==
													BaseItemKind.Episode
														? item.SeriesName
														: item.Name
												}
												imageType={
													item.Type ==
													BaseItemKind.Episode
														? "Primary"
														: Object.keys(
																item.ImageTags,
														  ).includes(
																"Thumb",
														  )
														? "Thumb"
														: "Backdrop"
												}
												cardCaption={
													item.Type ==
													BaseItemKind.Episode
														? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
														: item.Type ==
														  BaseItemKind.Series
														? `${
																item.ProductionYear
														  } - ${
																item.EndDate
																	? new Date(
																			item.EndDate,
																	  ).toLocaleString(
																			[],
																			{
																				year: "numeric",
																			},
																	  )
																	: "Present"
														  }`
														: item.ProductionYear
												}
												cardType="thumb"
												queryKey={[
													"home",
													"resume",
													"video",
												]}
												userId={
													user.data.Id
												}
												imageBlurhash={
													!!item
														.ImageBlurHashes
														?.Primary &&
													item
														.ImageBlurHashes
														?.Primary[
														Object.keys(
															item
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
					</ErrorBoundary>
					<ErrorBoundary
						fallback={
							<div className="error">
								<Typography>
									Error with resumeItemsAudio
								</Typography>
							</div>
						}
					>
						{resumeItemsAudio.isLoading ? (
							<CardsSkeleton />
						) : resumeItemsAudio.isSuccess &&
						  resumeItemsAudio.data.Items.length == 0 ? (
							<></>
						) : (
							<CardScroller
								displayCards={4}
								title="Continue Listening"
							>
								{resumeItemsAudio.data.Items.map(
									(item) => {
										return (
											<Card
												key={item.Id}
												item={item}
												cardTitle={
													item.Name
												}
												imageType={
													item.Type ==
													BaseItemKind.Episode
														? "Primary"
														: Object.keys(
																item.ImageTags,
														  ).includes(
																"Thumb",
														  )
														? "Thumb"
														: "Backdrop"
												}
												cardCaption={
													item.ProductionYear
												}
												cardType="thumb"
												queryKey={[
													"home",
													"resume",
													"audio",
												]}
												userId={
													user.data.Id
												}
												imageBlurhash={
													item
														.ImageBlurHashes
														?.Primary &&
													item
														.ImageBlurHashes
														?.Primary[
														Object.keys(
															item
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
					</ErrorBoundary>
					<ErrorBoundary
						fallback={
							<div className="error">
								<Typography>
									Error with LatestMediaSections
								</Typography>
							</div>
						}
					>
						{latestMediaLibs.map((lib) => {
							return (
								<LatestMediaSection
									key={lib[0]}
									latestMediaLib={lib}
								/>
							);
						})}
					</ErrorBoundary>
				</div>
			</main>
		</>
	);
};

export default Home;
