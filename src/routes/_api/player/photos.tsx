import { useApiInContext } from "@/utils/store/api";
import { usePhotosPlayback } from "@/utils/store/photosPlayback";
import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import brokenImage from "../../../../public/assetsStatic/broken-image.png";

import "./photos.scss";
import { Button } from "@mui/material";

export const Route = createFileRoute("/_api/player/photos")({
	component: PhotosPlayer,
});

function PhotosPlayer() {
	const api = useApiInContext((s) => s.api);
	const [photos, startIndex] = usePhotosPlayback((s) => [s.photos, s.index]);
	const [currentIndex, setCurrentIndex] = useState(startIndex);
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
							item.Id
								? api.getItemImageUrl(item.Id, "Primary", {
										// width: 250,
										fillWidth: 250,
										quality: 70,
									})
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
							? `${api.basePath}/Items/${currentPhoto.Id}/Download?api_key=${api.accessToken}`
							: brokenImage
					}
					alt="Item"
					transition={{ duration: 0.1 }}
					className="photos-currentPhoto"
				/>
			</AnimatePresence>
			<motion.div
				className="photos-overlay"
				whileHover={{ opacity: 1, transform: "translateY(0)" }}
				style={{ opacity: 0.5, transform: "translateY(80%)" }}
			>
				<div className="photos-preview-container">{allPhotos}</div>
			</motion.div>
		</div>
	);
}