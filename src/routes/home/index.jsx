/** @format */

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { EventEmitter as event } from "../../eventEmitter";
import { getServer } from "../../utils/storage/servers";
import { getUser, delUser } from "../../utils/storage/user";

import "./home.module.scss";

import Box from "@mui/material/Box";

import Carousel from "../../components/carousel";

// Custom Components
import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";
import { LatestMediaSection } from "../../components/homeSection/latestMediaSection";
import { CarouselSkeleton } from "../../components/skeleton/carousel";
import { CardsSkeleton } from "../../components/skeleton/cards";

// Icons
import { MediaTypeIconCollection } from "../../components/utils/iconsCollection.jsx";
import { MdiStar } from "../../components/icons/mdiStar";
import { MdiPlayOutline } from "../../components/icons/mdiPlayOutline";
import { MdiChevronRight } from "../../components/icons/mdiChevronRight";

import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import { useNavigate } from "react-router-dom";

import { useBackdropStore } from "../../utils/store/backdrop";

import CarouselSlide from "../../components/carouselSlide";
import { ItemFields } from "@jellyfin/sdk/lib/generated-client";
const Home = () => {
	const authUser = useQuery({
		queryKey: ["home", "authenticateUser"],
		queryFn: async () => {
			const server = await getServer();
			const user = await getUser();
			event.emit("create-jellyfin-api", server.Ip);
			const auth = await window.api.authenticateUserByName(
				user.Name,
				user.Password,
			);
			sessionStorage.setItem("accessToken", auth.data.AccessToken);
			event.emit("set-api-accessToken", window.api.basePath);
			return true;
		},
		enabled: false,
		networkMode: "always",
	});

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			let libs = await getUserViewsApi(window.api).getUserViews({
				userId: user.data.Id,
			});
			return libs.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const latestMediaLibraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			let libs = await getUserViewsApi(window.api).getUserViews({
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
			const media = await getUserLibraryApi(window.api).getLatestMedia(
				{
					userId: user.data.Id,
					fields: [
						ItemFields.Overview,
						ItemFields.ParentId,
						ItemFields.SeasonUserData,
						ItemFields.RecursiveItemCount,
						ItemFields.IsHd,
					],
					enableUserData: true,
					enableImages: true,
				},
			);
			return media.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const resumeItemsVideo = useQuery({
		queryKey: ["home", "resume", "video"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(window.api).getResumeItems(
				{
					userId: user.data.Id,
					limit: 10,
					mediaTypes: ["Video"],
					enableUserData: true,
				},
			);
			return resumeItems.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const resumeItemsAudio = useQuery({
		queryKey: ["home", "resume", "audio"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(window.api).getResumeItems(
				{
					userId: user.data.Id,
					limit: 10,
					mediaTypes: ["Audio"],
					enableUserData: true,
				},
			);
			return resumeItems.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const upNextItems = useQuery({
		queryKey: ["home", "upNext"],
		queryFn: async () => {
			const upNext = await getTvShowsApi(window.api).getNextUp({
				userId: user.data.Id,
				fields: [
					ItemFields.PrimaryImageAspectRatio,
					ItemFields.ParentId,
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
			<Box
				component="main"
				className="scrollY home"
				sx={{
					flexGrow: 1,
					pb: 3,
					position: "relative",
				}}
			>
				{latestMedia.isLoading ? (
					<CarouselSkeleton />
				) : (
					<Carousel
						content={latestMedia.data?.map((item, index) => (
							<CarouselSlide item={item} key={index} />
						))}
						onChange={(now) => {
							if (latestMedia.isSuccess) {
								if (
									!!latestMedia.data[now]
										.ParentBackdropImageTags
								) {
									setAppBackdrop(
										`${window.api.basePath}/Items/${latestMedia.data[now].ParentBackdropItemId}/Images/Backdrop`,
										latestMedia.data[now].Id,
									);
								} else {
									setAppBackdrop(
										`${window.api.basePath}/Items/${latestMedia.data[now].Id}/Images/Backdrop`,
										latestMedia.data[now].Id,
									);
								}
							}
						}}
					/>
				)}
				<Box
					className="padded-container"
					sx={{
						px: 3,
					}}
				>
					{libraries.isLoading ? (
						<CardsSkeleton />
					) : (
						<CardScroller displayCards={4} title="Libraries">
							{libraries.status == "success" &&
								libraries.data.Items.map(
									(item, index) => {
										return (
											<Card
												key={index}
												itemName={item.Name}
												itemId={item.Id}
												imageAspectRatio={
													item.PrimaryImageAspectRatio
												}
											></Card>
										);
									},
								)}
						</CardScroller>
					)}
					{upNextItems.isLoading ? (
						<CardsSkeleton />
					) : upNextItems.isSuccess &&
					  upNextItems.data.Items.length == 0 ? (
						<></>
					) : (
						<CardScroller displayCards={4} title="Up Next">
							{upNextItems.data.Items.map(
								(item, index) => {
									return (
										<Card
											key={index}
											itemName={item.Name}
											itemId={item.Id}
											imageType="Primary"
											imageAspectRatio={
												item.PrimaryImageAspectRatio
											}
										></Card>
									);
								},
							)}
						</CardScroller>
					)}
					{resumeItemsVideo.isLoading ? (
						<CardsSkeleton />
					) : resumeItemsVideo.data.Items.length == 0 ? (
						<></>
					) : (
						<CardScroller
							displayCards={4}
							title="Continue Watching"
						>
							{resumeItemsVideo.data.Items.map(
								(item, index) => {
									return (
										<Card
											key={index}
											itemName={item.Name}
											itemId={item.Id}
											imageType={
												!!item.SeriesName
													? "Primary"
													: "Backdrop"
											}
											imageAspectRatio={
												item.PrimaryImageAspectRatio
											}
										></Card>
									);
								},
							)}
						</CardScroller>
					)}
					{resumeItemsAudio.isLoading ? (
						<CardsSkeleton />
					) : resumeItemsAudio.data.Items.length == 0 ? (
						<></>
					) : (
						<CardScroller
							displayCards={4}
							title="Continue Listening"
						>
							{resumeItemsAudio.data.Items.map(
								(item, index) => {
									return (
										<Card
											key={index}
											itemName={
												!!item.SeriesId
													? item.SeriesName
													: item.Name
											}
											itemId={
												!!item.SeriesId
													? item.SeriesId
													: item.Id
											}
											// imageTags={false}
											imageTags={
												!!item.ImageTags
													.Primary
											}
											iconType={item.Type}
											subText={
												item.ProductionYear
											}
											playedPercent={
												item.UserData
													.PlayedPercentage
											}
											cardOrientation="sqaure"
											blurhash={
												item.ImageBlurHashes ==
												{}
													? ""
													: !!item
															.ImageTags
															.Primary
													? !!item
															.ImageBlurHashes
															.Primary
														? item
																.ImageBlurHashes
																.Primary[
																item
																	.ImageTags
																	.Primary
														  ]
														: ""
													: ""
											}
											currentUser={user.data}
											favourite={
												item.UserData
													.IsFavorite
											}
										></Card>
									);
								},
							)}
						</CardScroller>
					)}
					{latestMediaLibs.map((lib, index) => {
						return (
							<LatestMediaSection
								key={lib[0]}
								latestMediaLib={lib}
							/>
						);
					})}
				</Box>
			</Box>
		</>
	);
};

export default Home;
