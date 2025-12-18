import type { Api } from "@jellyfin/sdk";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import Chip from "@mui/material/Chip";
import { green, red, yellow } from "@mui/material/colors";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React, { type ReactNode, type RefObject } from "react";
import { Blurhash } from "react-blurhash";
import heroBg from "@/assets/herobg.png";
import ultraHdIcon from "@/assets/icons/4k.svg";
import dolbyAtmosIcon from "@/assets/icons/dolby-atmos.svg";
import dolbyDigitalIcon from "@/assets/icons/dolby-digital.svg";
import dolbyTrueHDIcon from "@/assets/icons/dolby-truehd.svg";
import dolbyVisionIcon from "@/assets/icons/dolby-vision.svg";
import dolbyVisionAtmosIcon from "@/assets/icons/dolby-vision-atmos.png";
import dtsIcon from "@/assets/icons/dts.svg";
import dtsHdMaIcon from "@/assets/icons/dts-hd-ma.svg";
import hdIcon from "@/assets/icons/hd.svg";
import hdrIcon from "@/assets/icons/hdr.svg";
import hdr10Icon from "@/assets/icons/hdr10.svg";
import hdr10PlusIcon from "@/assets/icons/hdr10-plus.svg";
import sdIcon from "@/assets/icons/sd.svg";
import sdrIcon from "@/assets/icons/sdr.svg";
import ItemBackdrop from "@/components/itemBackdrop";
import { getTypeIcon } from "@/components/utils/iconsCollection";
import { endsAt, getRuntime } from "@/utils/date/time";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import type MediaQualityInfo from "@/utils/types/mediaQualityInfo";
import "./itemHeader.scss";

interface ItemHeaderProps {
	item: BaseItemDto;
	api: Api | undefined;
	mediaQualityInfo?: MediaQualityInfo;
	scrollTargetRef?: RefObject<HTMLDivElement | null>;
	children?: ReactNode;
}

const ItemHeader = ({
	item,
	api,
	mediaQualityInfo,
	scrollTargetRef,
	children,
}: ItemHeaderProps) => {
	return (
		<div className="item-hero">
			<div className="item-hero-backdrop-container">
				{scrollTargetRef && (
					<ItemBackdrop
						targetRef={scrollTargetRef}
						alt={item.Name ?? ""}
						backdropSrc={
							item.BackdropImageTags?.length
								? api &&
									getImageUrlsApi(api).getItemImageUrlById(
										item.Id ?? "",
										"Backdrop",
										{ tag: item.BackdropImageTags[0] },
									)
								: undefined
						}
						fallbackSrc={heroBg}
					/>
				)}
			</div>
			<div
				className="item-hero-image-container"
				style={{
					aspectRatio: item.PrimaryImageAspectRatio ?? 1,
				}}
			>
				{item.ImageTags?.Primary ? (
					<div>
						<Blurhash
							hash={
								item.ImageBlurHashes?.Primary?.[item.ImageTags.Primary] ?? ""
							}
							className="item-hero-image-blurhash"
						/>
						<img
							alt={item.Name ?? ""}
							src={
								api &&
								getImageUrlsApi(api).getItemImageUrlById(
									item.Id ?? "",
									"Primary",
									{
										quality: 90,
										tag: item.ImageTags.Primary,
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
						{getTypeIcon(item.Type ?? "Movie")}
					</div>
				)}
			</div>
			<div className="item-hero-detail flex flex-column">
				{item.ImageTags?.Logo ? (
					<img
						alt={item.Name ?? ""}
						src={
							api &&
							getImageUrlsApi(api).getItemImageUrlById(item.Id ?? "", "Logo", {
								quality: 90,
								fillWidth: 592,
								fillHeight: 592,
								tag: item.ImageTags.Logo,
							})
						}
						onLoad={(e) => {
							e.currentTarget.style.opacity = "1";
						}}
						className="item-hero-logo"
					/>
				) : (
					<Typography mb={2} fontWeight={200} variant="h2">
						{item.Name}
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
						<img src={hdIcon} alt="hd" className="item-hero-mediaInfo badge" />
					)}
					{mediaQualityInfo?.isSD && (
						<img src={sdIcon} alt="sd" className="item-hero-mediaInfo badge" />
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
							<img src={dtsIcon} alt="dts" className="item-hero-mediaInfo" />
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
						{mediaQualityInfo.isAtmos && !mediaQualityInfo.isDolbyVision && (
							<img
								src={dolbyAtmosIcon}
								alt="dolby atmos"
								className="item-hero-mediaInfo"
							/>
						)}
						{mediaQualityInfo.isDolbyVision && !mediaQualityInfo.isAtmos && (
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
					</Stack>
				)}
			</div>
			{children}
		</div>
	);
};

export default ItemHeader;
