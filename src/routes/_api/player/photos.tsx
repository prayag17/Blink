import { useApiInContext } from "@/utils/store/api";
import { usePhotosPlayback } from "@/utils/store/photosPlayback";
import { createFileRoute } from "@tanstack/react-router";
import React, { type MouseEvent, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
//@ts-ignore
import brokenImage from "/assetsStatic/broken-image.png?url";

import { save } from "@tauri-apps/plugin-dialog";

import "./photos.scss";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import {
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
} from "@mui/material";
import { download } from "@tauri-apps/plugin-upload";
import { useSnackbar } from "notistack";

export const Route = createFileRoute("/_api/player/photos")({
	component: PhotosPlayer,
});

function PhotosPlayer() {
	const api = useApiInContext((s) => s.api);
	const [photos, startIndex] = usePhotosPlayback((s) => [s.photos, s.index]);
	const [currentIndex, setCurrentIndex] = useState(startIndex);
	const { enqueueSnackbar } = useSnackbar();
	const currentPhoto = useMemo(
		() => photos?.[currentIndex],
		[photos, currentIndex],
	);
	const allPhotos = useMemo(
		() =>
			photos?.map((item, index) => (
				<div
					onClick={() => setCurrentIndex(index)}
					key={item?.Id ?? "noPhoto"}
					className={
						index === currentIndex ? "photos-preview active" : "photos-preview"
					}
				>
					<img
						src={
							api
								? getImageUrlsApi(api).getItemImageUrlById(
										item.Id ?? "",
										"Primary",
										{
											// width: 250,
											fillWidth: 250,
											quality: 70,
										},
									)
								: brokenImage
						}
						style={{
							width: "auto",
							height: "100%",
							borderRadius: "2px",
						}}
						alt="Item"
					/>
				</div>
			)),
		[photos, currentIndex],
	);

	const handlePhotosChangePrev = useCallback(() => {
		setCurrentIndex(currentIndex - 1);
	}, [currentIndex]);
	const handlePhotosChangeNext = useCallback(() => {
		setCurrentIndex(currentIndex + 1);
	}, [currentIndex]);

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
	} | null>(null);
	const handleShowContextMenu = (e: MouseEvent) => {
		e.preventDefault();
		if (contextMenu === null) {
			setContextMenu({ mouseX: e.clientX + 2, mouseY: e.clientY - 6 });
		} else {
			setContextMenu(null);
		}
	};
	const handleContextMenuClose = useCallback(() => {
		setContextMenu(null);
	}, []);

	const handleImageDownload = useCallback(async () => {
		const pathToSave = await save({
			filters: [
				{
					name: "Image",
					extensions: ["png", "jpeg"],
				},
			],
		});

		if (pathToSave) {
			download(
				`${api?.basePath}/Items/${currentPhoto?.Id}/Download?api_key=${api?.accessToken}`,
				pathToSave,
			);
			enqueueSnackbar("Image download queued.", { variant: "info" });
		}
	}, [currentIndex]);

	return (
		<div className="photos">
			<AnimatePresence mode="wait">
				<motion.img
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					key={currentPhoto?.Id ?? "noPhoto"}
					src={
						currentPhoto
							? `${api?.basePath}/Items/${currentPhoto.Id}/Download?api_key=${api?.accessToken}`
							: brokenImage
					}
					alt="Item"
					transition={{ duration: 0.1 }}
					className="photos-currentPhoto"
				/>
			</AnimatePresence>
			<div className="photos-actions" onContextMenu={handleShowContextMenu}>
				<IconButton onClick={handlePhotosChangePrev}>
					<span className="material-symbols-rounded">chevron_left</span>
				</IconButton>
				<IconButton onClick={handlePhotosChangeNext}>
					<span className="material-symbols-rounded">chevron_right</span>
				</IconButton>
			</div>
			<Menu
				open={!!contextMenu?.mouseX}
				onClose={handleContextMenuClose}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu !== null
						? { left: contextMenu.mouseX, top: contextMenu.mouseY }
						: undefined
				}
			>
				<MenuItem onClick={handleImageDownload}>
					<ListItemIcon>
						<span className="material-symbols-rounded">download</span>
					</ListItemIcon>
					<ListItemText>Download</ListItemText>
				</MenuItem>
			</Menu>
			<div className="photos-overlay">
				<div className="photos-preview-container">{allPhotos}</div>
			</div>
		</div>
	);
}