import {
	type BaseItemDto,
	BaseItemKind,
	ItemFields,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getShowApi } from "@jellyfin/sdk/lib/utils/api/show-api";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";
import LikeButton from "@/components/buttons/likeButton";
import MarkPlayedButton from "@/components/buttons/markPlayedButton";
import PlayButton from "@/components/buttons/playButton";
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import EpisodeSkeleton from "@/components/skeleton/episode";
import { SeasonSelectorSkeleton } from "@/components/skeleton/seasonSelector";
import { getRuntimeCompact, getRuntimeMusic } from "@/utils/date/time";
import useDefaultSeason from "@/utils/hooks/useDefaultSeason";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import {
	getSeasonsQueryOptions,
	getSpecialFeaturesQueryOptions,
} from "@/utils/queries/itemDetail";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import CastAndCrew from "../castAndCrew";
import ItemDetailLayout, { ExternalLinks } from "../itemDetailLayout";
import SimilarItems from "../similarItems";

const getEpisodeDateString = (date: Date) =>
	new Intl.DateTimeFormat(navigator.language ?? "en-US", {
		dateStyle: "full",
	}).format(date);

const SeriesView = ({ item }: { item: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const navigate = useNavigate();
	const id = item.Id ?? "";

	const seasons = useQuery(getSeasonsQueryOptions(api, user?.Id, id));
	const specialFeatures = useQuery(
		getSpecialFeaturesQueryOptions(api, user?.Id, id),
	);

	const [currentSeason, setCurrentSeason] = useDefaultSeason(seasons, id);
	const currentSeasonId = seasons.data?.Items?.[currentSeason]?.Id;

	const currentSeasonItem = useQuery({
		queryKey: ["item", id, "season", currentSeason],
		queryFn: async () => {
			if (!api || !currentSeasonId) return null;
			const result = await getLibraryApi(api).getItem({
				userId: user?.Id,
				itemId: currentSeasonId,
			});
			return result.data;
		},
		enabled: seasons.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const episodes = useQuery({
		queryKey: ["item", id, "season", currentSeason, "episodes"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getShowApi(api).getEpisodes({
				userId: user?.Id,
				seriesId: id,
				seasonId: currentSeasonId,
				fields: [ItemFields.Overview],
				isMissing: false,
			});
			return result.data;
		},
		enabled: seasons.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	// Prefer the selected season's backdrop over the series one.
	const season = currentSeasonItem.data;
	const backdropOwner = season?.BackdropImageTags?.length ? season : item;
	const backdropTag = backdropOwner.BackdropImageTags?.[0];
	const backdropSrc =
		api && backdropTag
			? getImageUrlsApi(api).getItemImageUrlById(
					backdropOwner.Id ?? "",
					"Backdrop",
					{ tag: backdropTag },
				)
			: undefined;
	const backdropHash =
		(backdropTag && backdropOwner.ImageBlurHashes?.Backdrop?.[backdropTag]) ||
		"";

	return (
		<ItemDetailLayout
			item={item}
			variant="series"
			backdropSrc={backdropSrc}
			backdropHash={backdropHash}
			playButton={
				<PlayButton
					item={item}
					itemType={BaseItemKind.Series}
					userId={user?.Id}
					buttonProps={{ fullWidth: true }}
				/>
			}
			main={<ExternalLinks item={item} />}
		>
			{seasons.isPending ? (
				<SeasonSelectorSkeleton />
			) : (
				<div className="item-series-seasons-container">
					<div
						style={{
							display: "flex",
							width: "100%",
							alignItems: "center",
							justifyContent: "space-between",
							paddingBottom: " 0.5em",
						}}
					>
						<div style={{ display: "flex", gap: "1em" }}>
							<Typography variant="h5">
								{seasons.data?.Items?.[currentSeason]?.Name}
							</Typography>
							<Chip
								label={
									episodes.isPending ? (
										<CircularProgress
											size={20}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										/>
									) : (
										episodes.data?.TotalRecordCount
									)
								}
							/>
						</div>
						<div style={{ display: "flex", gap: "0.75em" }}>
							{season && (
								<>
									<LikeButton
										itemId={season.Id}
										isFavorite={season.UserData?.IsFavorite}
										queryKey={["item", id]}
										userId={user?.Id}
										itemName={season.Name}
									/>
									<MarkPlayedButton
										itemId={season.Id}
										isPlayed={season.UserData?.Played}
										queryKey={["item", id]}
										userId={user?.Id}
										itemName={season.Name}
									/>
								</>
							)}
							<TextField
								value={currentSeason}
								onChange={(e) => {
									const seasonIndex = Number(e.target.value);
									if (Number.isFinite(seasonIndex)) {
										setCurrentSeason(seasonIndex);
										sessionStorage.setItem(
											`season-${id}`,
											seasonIndex.toString(),
										);
									}
								}}
								select
								slotProps={{
									select: { MenuProps: { disableScrollLock: true } },
								}}
								size="small"
							>
								{seasons.data?.Items?.map((seasonItem, index) => (
									<MenuItem key={seasonItem.Id} value={index}>
										{seasonItem.Name}
									</MenuItem>
								))}
							</TextField>
						</div>
					</div>
					<Divider />
					<div className="item-detail-episode-container">
						{episodes.isPending ? (
							<EpisodeSkeleton />
						) : (
							episodes.data?.Items?.map((episode) => (
								<motion.div
									key={episode.Id}
									onClick={() =>
										navigate({
											to: "/item/$id",
											params: { id: episode.Id ?? "" },
											search: { type: BaseItemKind.Episode },
										})
									}
									initial={{ transform: "translateY(10px)", opacity: 0 }}
									whileInView={{ opacity: 1, transform: "translateY(0px)" }}
									viewport={{ once: true }}
									transition={{ duration: 0.2, ease: "backInOut" }}
									style={{ width: "100%" }}
									className="item-detail-episode"
								>
									<Typography variant="subtitle1" sx={{ textAlign: "center" }}>
										{episode.IndexNumberEnd
											? `${episode.IndexNumber} / ${episode.IndexNumberEnd}`
											: (episode.IndexNumber ?? 0)}
									</Typography>
									<div
										className={
											episode.UserData?.Played
												? "item-detail-episode-image-container watched"
												: "item-detail-episode-image-container"
										}
									>
										<div className="item-detail-episode-image-overlay">
											<PlayButton
												item={episode}
												itemType={BaseItemKind.Episode}
												userId={user?.Id}
												size="medium"
												buttonProps={{
													//@ts-expect-error
													color: "white",
													style: { color: "black " },
												}}
												iconOnly
											/>
										</div>
										<div className="item-detail-episode-image-icon-container">
											<span className="material-symbols-rounded item-detail-episode-image-icon">
												tv_gen
											</span>
										</div>
										<img
											alt={episode.Name ?? ""}
											src={
												api &&
												getImageUrlsApi(api).getItemImageUrlById(
													episode.Id ?? "",
													"Primary",
													{ tag: episode.ImageTags?.Primary, fillHeight: 300 },
												)
											}
											className="item-detail-episode-image"
											onLoad={(e) => {
												e.currentTarget.style.opacity = "1";
											}}
										/>
										{(episode.UserData?.PlaybackPositionTicks ?? 0) > 0 && (
											<div className="card-progress-container">
												<div
													className="card-progress"
													style={{
														width: `${episode.UserData?.PlayedPercentage}%`,
													}}
												/>
											</div>
										)}
									</div>
									<div className="item-detail-episode-info">
										<Typography variant="subtitle1">{episode.Name}</Typography>
										<div
											className="flex flex-row flex-align-center"
											style={{ gap: "0.5em" }}
										>
											{episode.PremiereDate && (
												<Chip
													variant="filled"
													label={getEpisodeDateString(
														new Date(episode.PremiereDate),
													)}
													size="small"
												/>
											)}
											<Typography variant="caption">
												{getRuntimeCompact(episode.RunTimeTicks ?? 0)}
											</Typography>
										</div>
										<Typography
											variant="caption"
											style={{
												display: "-webkit-box",
												textOverflow: "ellipsis",
												overflow: "hidden",
												WebkitLineClamp: 2,
												WebkitBoxOrient: "vertical",
												width: "100%",
												opacity: 0.7,
											}}
										>
											{episode.Overview}
										</Typography>
									</div>
									<div
										className="item-detail-episode-buttons"
										onClick={(e) => e.stopPropagation()}
									>
										<LikeButton
											itemId={episode.Id}
											itemName={episode.Name}
											isFavorite={episode.UserData?.IsFavorite}
											queryKey={["item", id]}
											userId={user?.Id}
										/>
										<MarkPlayedButton
											itemId={episode.Id}
											itemName={episode.Name}
											isPlayed={episode.UserData?.Played}
											queryKey={["item", id]}
											userId={user?.Id}
										/>
									</div>
								</motion.div>
							))
						)}
					</div>
				</div>
			)}
			<CastAndCrew people={item.People} api={api} />
			{(specialFeatures.data?.length ?? 0) > 0 && (
				<CardScroller
					title="Special Features"
					displayCards={7}
					disableDecoration
				>
					{specialFeatures.data?.map((special) => (
						<Card
							key={special.Id}
							item={special}
							seriesId={special.SeriesId}
							cardTitle={special.Name}
							imageType="Primary"
							cardCaption={getRuntimeMusic(special.RunTimeTicks ?? 0)}
							cardType="portrait"
							queryKey={["item", id, "similarItem"]}
							userId={user?.Id}
							onClick={() => {}}
						/>
					))}
				</CardScroller>
			)}
			<SimilarItems item={item} />
		</ItemDetailLayout>
	);
};

export default SeriesView;
