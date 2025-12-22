import {
	BaseItemKind,
	ItemFields,
	LocationType,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import React, { useLayoutEffect, useRef } from "react";
import LikeButton from "@/components/buttons/likeButton";
import MarkPlayedButton from "@/components/buttons/markPlayedButton";
import PlayButton from "@/components/buttons/playButton";
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import ItemHeader from "@/components/itemHeader";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ShowMoreText from "@/components/showMoreText";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./boxset.scss";

import { createFileRoute } from "@tanstack/react-router";
import IconLink from "@/components/iconLink";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useCentralStore } from "@/utils/store/central";

export const Route = createFileRoute("/_api/boxset/$id")({
	component: BoxSetTitlePage,
});

function BoxSetTitlePage() {
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

	const collectionItems = useQuery({
		queryKey: ["item", id, "collection"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				parentId: id,
				fields: [ItemFields.SeasonUserData, ItemFields.Overview],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const similarItems = useQuery({
		queryKey: ["item", "similarItem", id],
		queryFn: async () => {
			if (!api) return null;
			const result = await getLibraryApi(api).getSimilarItems({
				userId: user?.Id,
				itemId: id,
				limit: 16,
			});
			return result.data;
		},
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);

	useLayoutEffect(() => {
		if (api && item.isSuccess) {
			if (item.data?.BackdropImageTags?.length) {
				setBackdrop(
					getImageUrlsApi(api).getItemImageUrlById(
						item.data.Id ?? "",
						"Backdrop",
						{
							tag: item.data.BackdropImageTags[0],
						},
					),
				);
			} else {
				setBackdrop("");
			}
		}
	}, [item.isSuccess]);

	const scrollTargetRef = useRef<HTMLDivElement | null>(null);

	if (item.isPending || similarItems.isPending) {
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
	if (item.isSuccess && item.data && similarItems.isSuccess) {
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
				className="scrollY item item-boxset padded-top"
			>
				<div ref={scrollTargetRef} />
				<ItemHeader
					item={item.data}
					api={api}
					scrollTargetRef={scrollTargetRef}
				>
					<div className="item-hero-buttons-container flex flex-row">
						<div className="flex flex-row fullWidth">
							<PlayButton
								item={item.data}
								itemType={item.data.Type ?? "BoxSet"}
								userId={user?.Id}
								buttonProps={{
									fullWidth: true,
								}}
							/>
						</div>
						<div className="flex flex-row" style={{ gap: "1em" }}>
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
				<div
					className="item-detail"
					style={{
						marginBottom: "2em",
					}}
				>
					<ShowMoreText content={item.data.Overview ?? ""} collapsedLines={4} />
					<div
						style={{
							width: "100%",
						}}
					>
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
									url={url.Url ?? ""}
									name={url.Name ?? ""}
									key={url.Url}
								/>
							))}
						</div>
					</div>
				</div>
				{(collectionItems.data?.TotalRecordCount ?? 0) > 0 && (
					<CardScroller title="" displayCards={7} disableDecoration>
						{collectionItems.data?.Items?.map((similar) => {
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
									cardCaption={similar.ProductionYear}
									cardType={"portrait"}
									queryKey={["item", id]}
									userId={user?.Id}
								/>
							);
						})}
					</CardScroller>
				)}
				{similarItems.data?.TotalRecordCount && (
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
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
}

export default BoxSetTitlePage;
