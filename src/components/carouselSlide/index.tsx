import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { green, red, yellow } from "@mui/material/colors";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";
import { endsAt, getRuntime } from "@/utils/date/time";

import { useApiInContext } from "@/utils/store/api";
import { useCarouselStore } from "@/utils/store/carousel";
import { useCentralStore } from "@/utils/store/central";
import LikeButton from "../buttons/likeButton";
import MarkPlayedButton from "../buttons/markPlayedButton";
import PlayButton from "../buttons/playButton";
import { getTypeIcon } from "../utils/iconsCollection";

const textVariants = {
	initial: (direction: string) => ({
		x: direction === "right" ? 40 : -40,
		opacity: 0,
	}),
	animate: {
		x: 0,
		opacity: 1,
		transition: {
			duration: 0.35,
			ease: [0.2, 0, 0, 1],
		},
	},
	exit: (direction: string) => ({
		x: direction === "right" ? -40 : 40,
		opacity: 0,
		transition: {
			duration: 0.2,
			ease: "easeInOut",
		},
	}),
};

const CarouselSlide = ({ item }: { item: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const navigate = useNavigate();

	const user = useCentralStore((s) => s.currentUser);

	const handleMoreInfo = () => {
		if (item.Id) {
			switch (item.Type) {
				case BaseItemKind.BoxSet:
					navigate({ to: "/boxset/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.Episode:
					navigate({ to: "/episode/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.MusicAlbum:
					navigate({ to: "/album/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.MusicArtist:
					navigate({ to: "/artist/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.Person:
					navigate({ to: "/person/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.Series:
					navigate({ to: "/series/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.Playlist:
					navigate({ to: "/playlist/$id", params: { id: item.Id } });
					break;
				default:
					navigate({ to: "/item/$id", params: { id: item.Id } });
					break;
			}
		}
	};

	const [animationDirection] = useCarouselStore((state) => [state.direction]);

	return (
		<div className="hero-carousel-slide">
			<motion.div
				className="hero-carousel-background-container"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.4, ease: "easeInOut" }}
			>
				{item.BackdropImageTags?.length ? (
					<img
						alt={item.Name ?? "item"}
						className="hero-carousel-background-image"
						src={
							item.ParentBackdropItemId
								? `${api?.basePath}/Items/${item.ParentBackdropItemId}/Images/Backdrop?quality=80`
								: `${api?.basePath}/Items/${item.Id}/Images/Backdrop?quality=80&fillHeight=1400`
						}
						style={{
							opacity: 0,
						}}
						onLoad={(e) => {
							e.currentTarget.style.opacity = "1";
						}}
						loading="eager"
					/>
				) : (
					<div className="hero-carousel-background-icon-container">
						{getTypeIcon(item.Type ?? "Movie")}
					</div>
				)}
			</motion.div>
			<motion.div
				className="hero-carousel-detail"
				initial="initial"
				animate="animate"
				exit="exit"
				variants={{
					animate: {
						transition: {
							staggerChildren: 0.05,
							delayChildren: 0.05,
						},
					},
					exit: {
						transition: {
							staggerChildren: 0.02,
							staggerDirection: -1,
						},
					},
				}}
			>
				{/* @ts-ignore */}
				<Typography
					component={motion.div}
					custom={animationDirection}
					variants={textVariants}
					key={item.Id}
					variant="h2"
					className="hero-carousel-text"
					sx={{
						mb: "5px",
					}}
					fontWeight={600}
					overflow="visible"
				>
					{!item.ImageTags?.Logo ? (
						item.Name
					) : (
						<img
							alt={item.Name ?? "Item"}
							className="hero-carousel-text-logo"
							src={`${api?.basePath}/Items/${item.Id}/Images/Logo?quality=90&tag=${item.ImageTags.Logo}`}
							style={{
								opacity: 0,
								transition: "opacity 0.2s",
								objectFit: "contain",
							}}
							onLoad={(e) => {
								e.currentTarget.style.opacity = "1";
							}}
						/>
					)}
				</Typography>
				{/* @ts-ignore */}
				<Stack
					component={motion.div}
					custom={animationDirection}
					variants={textVariants}
					direction="row"
					gap={2}
					className="hero-carousel-info"
					mt={1}
					justifyItems="flex-start"
					alignItems="center"
				>
					{item.PremiereDate && (
						<Typography style={{ opacity: "0.8" }} variant="subtitle2">
							{item.ProductionYear ?? ""}
						</Typography>
					)}
					{item.OfficialRating && (
						<Chip variant="filled" size="small" label={item.OfficialRating} />
					)}

					{item.CommunityRating && (
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
								{Math.round(item.CommunityRating * 10) / 10}
							</Typography>
						</div>
					)}
					{item.CriticRating && (
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
									color: item.CriticRating > 50 ? green[400] : red[400],
								}}
							>
								{item.CriticRating > 50 ? "thumb_up" : "thumb_down"}
							</div>
							<Typography
								style={{
									opacity: "0.8",
								}}
								variant="subtitle2"
							>
								{item.CriticRating}
							</Typography>
						</div>
					)}

					{item.RunTimeTicks && (
						<Typography style={{ opacity: "0.8" }} variant="subtitle2">
							{getRuntime(item.RunTimeTicks)}
						</Typography>
					)}
					{item.RunTimeTicks && (
						<Typography style={{ opacity: "0.8" }} variant="subtitle2">
							{endsAt(
								item.RunTimeTicks - (item.UserData?.PlaybackPositionTicks ?? 0),
							)}
						</Typography>
					)}
					<Typography variant="subtitle2" style={{ opacity: 0.8 }}>
						{item.Genres?.slice(0, 4).join(" / ")}
					</Typography>
				</Stack>
				{/* @ts-ignore */}
				<Typography
					component={motion.div}
					custom={animationDirection}
					variants={textVariants}
					className="hero-carousel-overview"
					variant="body1"
					fontWeight={400}
				>
					{item.Overview}
				</Typography>

				{/* @ts-ignore */}
				<Stack
					direction="row"
					gap={2}
					width="100%"
					className="hero-carousel-button-container"
					alignItems="center"
					component={motion.div}
					custom={animationDirection}
					variants={textVariants}
				>
					<PlayButton
						item={item}
						userId={user?.Id}
						itemType={item.Type ?? "Movie"}
						buttonProps={{
							size: "large",
						}}
						audio={
							item.Type === BaseItemKind.MusicAlbum ||
							item.Type === BaseItemKind.Audio ||
							item.Type === BaseItemKind.AudioBook ||
							item.Type === BaseItemKind.Playlist
						}
						playlistItem={item.Type === BaseItemKind.Playlist}
						playlistItemId={item.Id}
					/>

					<Button
						size="large"
						//@ts-expect-error
						color="white"
						variant="outlined"
						endIcon={
							<div
								className="material-symbols-rounded"
								style={{
									fontSize: "2em",
								}}
							>
								chevron_right
							</div>
						}
						onClick={handleMoreInfo}
					>
						More info
					</Button>
					<Stack direction="row" gap={1}>
						<LikeButton
							itemId={item.Id}
							queryKey={["home", "latestMedia"]}
							userId={user?.Id}
							isFavorite={item.UserData?.IsFavorite}
							itemName={item.Name}
						/>
						<MarkPlayedButton
							itemId={item.Id}
							queryKey={["home", "latestMedia"]}
							userId={user?.Id}
							isPlayed={item.UserData?.Played}
							itemName={item.Name}
						/>
					</Stack>
				</Stack>
			</motion.div>
		</div>
	);
};

export default CarouselSlide;
