import React, {
	useState,
	useLayoutEffect,
	useRef,
	type ReactNode,
} from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { AnimatePresence, motion } from "framer-motion";

import { BaseItemKind, LocationType } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { Card } from "@/components/card/card";
import { useQuery } from "@tanstack/react-query";

import { Blurhash } from "react-blurhash";

import LikeButton from "@/components/buttons/likeButton";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import { useBackdropStore } from "@/utils/store/backdrop";

import meshBg from "@/assets/herobg.png";
import ShowMoreText from "@/components/showMoreText";
import "./person.scss";

import IconLink from "@/components/iconLink";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { createFileRoute } from "@tanstack/react-router";

type TabPanelProps = {
	children: ReactNode;
	index: number;
	value: number;
};

function TabPanel(props: TabPanelProps) {
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
			{value === index && <div>{children}</div>}
		</div>
	);
}

export const Route = createFileRoute("/_api/person/$id")({
	component: PersonTitlePage,
});

function PersonTitlePage() {
	const { id } = Route.useParams();
	const api = useApiInContext((s) => s.api);

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

	const personMovies = useQuery({
		queryKey: ["item", id, "personMovies"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Movie],
				recursive: true,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: ["Descending"],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.Person,
		networkMode: "always",
	});
	const personShows = useQuery({
		queryKey: ["item", id, "personShows"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Series],
				recursive: true,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: ["Descending"],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.Person,
		networkMode: "always",
	});
	const personBooks = useQuery({
		queryKey: ["item", id, "personBooks"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Book],
				recursive: true,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: ["Descending"],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.Person,
		networkMode: "always",
	});
	const personPhotos = useQuery({
		queryKey: ["item", id, "personPhotos"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Photo],
				recursive: true,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.Person,
		networkMode: "always",
	});
	const personEpisodes = useQuery({
		queryKey: ["item", id, "personEpisodes"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Episode],
				recursive: true,
				fields: ["SeasonUserData", "Overview"],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.Person,
		networkMode: "always",
	});

	const [activePersonTab, setActivePersonTab] = useState(0);

	const personTabs = [
		{
			title: "Movies",
			data: personMovies,
			queryKey: ["item", id, "personMovies"],
		},
		{
			title: "TV Shows",
			data: personShows,
			queryKey: ["item", id, "personShows"],
		},
		{
			title: "Books",
			data: personBooks,
			queryKey: ["item", id, "personBooks"],
		},
		{
			title: "Photos",
			data: personPhotos,
			queryKey: ["item", id, "personPhotos"],
		},
		{
			title: "Episodes",
			data: personEpisodes,
			queryKey: ["item", id, "personEpisodes"],
		},
	];

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);

	useLayoutEffect(() => {
		if (
			personMovies.isSuccess &&
			personShows.isSuccess &&
			personBooks.isSuccess &&
			personPhotos.isSuccess &&
			personEpisodes.isSuccess
		) {
			if (personMovies.data?.TotalRecordCount !== 0) {
				setActivePersonTab(0);
			} else if (personShows.data?.TotalRecordCount !== 0) {
				setActivePersonTab(1);
			} else if (personBooks.data?.TotalRecordCount !== 0) {
				setActivePersonTab(2);
			} else if (personPhotos.data?.TotalRecordCount !== 0) {
				setActivePersonTab(3);
			} else if (personEpisodes.data?.TotalRecordCount !== 0) {
				setActivePersonTab(4);
			}
		}
		setBackdrop("", "");
	}, [
		personMovies.isSuccess,
		personShows.isSuccess,
		personBooks.isSuccess,
		personPhotos.isSuccess,
		personEpisodes.isSuccess,
	]);

	const [animationDirection, setAnimationDirection] = useState("forward");

	const pageRef = useRef(null);

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
				className="scrollY padded-top item item-person flex flex-column"
				ref={pageRef}
			>
				<div className="item-hero">
					<div className="item-hero-backdrop-container">
						<img
							alt={item.data.Name ?? ""}
							src={meshBg}
							className="item-hero-backdrop"
							onLoad={(e) => {
								e.currentTarget.style.opacity = "1";
							}}
						/>
					</div>
					<div
						className="item-hero-image-container"
						style={{
							aspectRatio: item.data.PrimaryImageAspectRatio ?? 1,
						}}
					>
						{item.data.ImageTags?.Primary && (
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
						)}
					</div>
					<div className="item-hero-detail flex flex-column">
						<Typography variant="h2" fontWeight={200} mb={2}>
							{item.data.Name}
						</Typography>

						<LikeButton
							itemName={item.data.Name}
							itemId={item.data.Id}
							queryKey={["item", id]}
							isFavorite={item.data.UserData?.IsFavorite}
							userId={user?.Id}
						/>
					</div>
				</div>
				<div className="item-detail">
					<div style={{ width: "100%" }}>
						<ShowMoreText
							content={item.data.Overview ?? ""}
							collapsedLines={4}
						/>
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
									url.Name &&
									url.Url && <IconLink url={url.Url} name={url.Name} />,
							)}
						</div>
					</div>
					<div
						style={{
							width: "100%",
						}}
					>
						{item.data.PremiereDate && (
							<div>
								<Typography variant="h6">Birth</Typography>
								<Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
									{new Date(item.data.PremiereDate).toDateString()}
								</Typography>
							</div>
						)}
						{item.data.EndDate && (
							<div>
								<Typography variant="h6" mt={2}>
									Death
								</Typography>
								<Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
									{new Date(item.data.EndDate).toDateString()}
								</Typography>
							</div>
						)}
					</div>
				</div>

				<div className="item-detail-person-container">
					<div className="item-detail-person-header">
						<Tabs
							variant="scrollable"
							value={activePersonTab}
							onChange={(_, newVal) => {
								if (newVal > activePersonTab) {
									setAnimationDirection("forward");
								} else if (newVal < activePersonTab) {
									setAnimationDirection("backwards");
								}
								setActivePersonTab(newVal);
							}}
						>
							{personTabs.map((tab) => {
								return (
									<Tab
										key={tab.title}
										label={tab.title}
										disabled={tab.data.data?.TotalRecordCount === 0}
									/>
								);
							})}
						</Tabs>
						<Divider />
					</div>
					<AnimatePresence>
						{personTabs.map((tab, index) => {
							return (
								<TabPanel value={activePersonTab} index={index} key={tab.title}>
									<motion.div
										className={`item-detail-person-cards ${
											tab.title === "Movies" ||
											tab.title === "TV Shows" ||
											tab.title === "Books"
												? "col-7"
												: "col-4"
										}`}
										key={tab.queryKey.join("")}
										initial={{
											opacity: 0,
											transform:
												animationDirection === "forward"
													? "translate(30px)"
													: "translate(-30px)",
										}}
										animate={{
											opacity: 1,
											transform: "translate(0px)",
										}}
										transition={{
											duration: 0.2,
											ease: "anticipate",
										}}
									>
										{tab.data.isSuccess &&
											tab.data.data?.Items?.map((tabitem) => {
												return (
													<Card
														key={tabitem.Id}
														item={tabitem}
														cardTitle={
															tabitem.Type === BaseItemKind.Episode
																? tabitem.SeriesName
																: tabitem.Name
														}
														imageType={"Primary"}
														cardCaption={
															tabitem.Type === BaseItemKind.Episode
																? `S${tabitem.ParentIndexNumber}:E${tabitem.IndexNumber} - ${tabitem.Name}`
																: tabitem.Type === BaseItemKind.Series
																	? `${tabitem.ProductionYear} - ${
																			tabitem.EndDate
																				? new Date(
																						tabitem.EndDate,
																					).toLocaleString([], {
																						year: "numeric",
																					})
																				: "Present"
																		}`
																	: tabitem.ProductionYear
														}
														cardType={
															tabitem.Type === BaseItemKind.Episode
																? "thumb"
																: "portrait"
														}
														queryKey={tab.queryKey}
														userId={user?.Id}
													/>
												);
											})}
									</motion.div>
								</TabPanel>
							);
						})}
					</AnimatePresence>
				</div>
			</motion.div>
		);
	}
	if (item.isError) {
		return <ErrorNotice />;
	}
}

export default PersonTitlePage;
