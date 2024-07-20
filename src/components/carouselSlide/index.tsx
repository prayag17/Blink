import React, { memo } from "react";
import { Blurhash } from "react-blurhash";

import { motion } from "framer-motion";

import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { yellow } from "@mui/material/colors";

import { endsAt, getRuntime } from "@/utils/date/time";
import { green, red } from "@mui/material/colors";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getTypeIcon } from "../utils/iconsCollection";

import { useApiInContext } from "@/utils/store/api";
import { useCarouselStore } from "@/utils/store/carousel";
import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import LikeButton from "../buttons/likeButton";
import MarkPlayedButton from "../buttons/markPlayedButton";
import PlayButton from "../buttons/playButton";

const availableSpecialRoutes = [
	BaseItemKind.Series,
	BaseItemKind.BoxSet,
	BaseItemKind.MusicAlbum,
];

/**
 * @typedef {Object} Props
 * @property {import("@jellyfin/sdk/lib/generated-client/models").BaseItemDto} item
 */

/**
 * @description Carousel slide component
 * @param {Props}
 * @returns {React.Component}
 */
const CarouselSlide = ({ item }: { item: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const navigate = useNavigate();

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const handleMoreInfo = () => {
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
	};

	const [animationDirection] = useCarouselStore((state) => [state.direction]);

	return (
		<Paper
			className="hero-carousel-slide"
			sx={{
				background: "transparent",
				// px: 3,
			}}
			elevation={0}
		>
			<div className="hero-carousel-background-container">
				{item.BackdropImageTags?.length ? (
					<img
						alt={item.Name}
						className="hero-carousel-background-image"
						src={
							item.ParentBackdropItemId
								? `${api.basePath}/Items/${item.ParentBackdropItemId}/Images/Backdrop?quality=80`
								: `${api.basePath}/Items/${item.Id}/Images/Backdrop?quality=80&fillHeight=1400`
						}
						style={{
							opacity: 0,
						}}
						onLoad={(e) => {
							e.target.style.opacity = 1;
						}}
						loading="eager"
					/>
				) : (
					<div className="hero-carousel-background-icon-container">
						{getTypeIcon(item.Type)}
					</div>
				)}
			</div>
			<div className="hero-carousel-detail">
				<Typography
					component={motion.div}
					initial={{
						transform:
							animationDirection === "right"
								? "translateX(60px)"
								: "translateX(-60px)",
						opacity: 0,
					}}
					animate={{
						transform: "translateX(0px)",
						opacity: 1,
					}}
					exit={{
						transform:
							animationDirection === "right"
								? "translateX(-60px)"
								: "translateX(60px)",
						opacity: 0,
					}}
					transition={{
						duration: 0.25,
						ease: "easeInOut",
					}}
					key={item.Id}
					variant="h2"
					className="hero-carousel-text"
					sx={{
						mb: "5px",
					}}
					fontWeight={200}
					overflow="visible"
				>
					{!item.ImageTags.Logo ? (
						item.Name
					) : (
						<img
							alt={item.Name}
							className="hero-carousel-text-logo"
							src={`${api.basePath}/Items/${item.Id}/Images/Logo?quality=90&tag=${item.ImageTags.Logo}`}
							style={{
								opacity: 0,
								transition: "opacity 0.2s",
								objectFit: "contain",
							}}
							onLoad={(e) => {
								e.target.style.opacity = 1;
							}}
						/>
					)}
				</Typography>
				<Stack
					component={motion.div}
					initial={{
						transform:
							animationDirection === "right"
								? "translateX(20px)"
								: "translateX(-20px)",
						opacity: 0,
					}}
					animate={{
						transform: "translateX(0px)",
						opacity: 1,
					}}
					exit={{
						transform:
							animationDirection === "right"
								? "translateX(-20px)"
								: "translateX(20px)",

						opacity: 0,
					}}
					transition={{
						duration: 0.25,
						ease: "easeInOut",
					}}
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
							{endsAt(item.RunTimeTicks - item.UserData.PlaybackPositionTicks)}
						</Typography>
					)}
					<Typography variant="subtitle2" style={{ opacity: 0.8 }}>
						{item.Genres?.slice(0, 4).join(" / ")}
					</Typography>
				</Stack>
				<Typography
					component={motion.div}
					initial={{
						transform:
							animationDirection === "right"
								? "translateX(20px)"
								: "translateX(-20px)",
						opacity: 0,
					}}
					animate={{
						transform: "translateX(0px)",
						opacity: 1,
					}}
					exit={{
						transform:
							animationDirection === "right"
								? "translateX(-20px)"
								: "translateX(20px)",

						opacity: 0,
					}}
					transition={{
						duration: 0.25,
						ease: "easeInOut",
					}}
					className="hero-carousel-text"
					sx={{
						display: "-webkit-box",
						maxWidth: "70%",
						maxHeight: "50%",
						textOverflow: "ellipsis",
						overflow: "hidden",
						WebkitLineClamp: "4",
						WebkitBoxOrient: "vertical",
					}}
					variant="subtitle2"
					fontWeight={300}
				>
					{item.Overview}
				</Typography>

				<Stack
					mt={3}
					direction="row"
					gap={3}
					width="100%"
					className="hero-carousel-button-container"
					alignItems="center"
				>
					<PlayButton
						item={item}
						itemId={item.Id}
						userId={user.data.Id}
						itemType={item.Type}
						currentAudioTrack={0}
						currentSubTrack={0}
						currentVideoTrack={0}
						buttonProps={{
							size: "large",
						}}
						itemUserData={item.UserData}
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
							userId={user.data.Id}
							isFavorite={item.UserData.IsFavorite}
							itemName={item.Name}
						/>
						<MarkPlayedButton
							itemId={item.Id}
							queryKey={["home", "latestMedia"]}
							userId={user.data.Id}
							isPlayed={item.UserData.Played}
							itemName={item.Name}
						/>
					</Stack>
				</Stack>
			</div>
		</Paper>
	);
};

export default CarouselSlide;
