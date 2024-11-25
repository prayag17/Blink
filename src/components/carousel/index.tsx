import { AnimatePresence, motion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { MouseEvent, PointerEvent } from "react";

import { useCarouselStore } from "../../utils/store/carousel";
import "./carousel.scss";
import { useApiInContext } from "@/utils/store/api";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import CarouselSlide from "../carouselSlide";

import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import Slider from "../Slider";
import { getTypeIcon } from "../utils/iconsCollection";

const swipeConfidenceThreshold = 8000;
const swipePower = (offset: number, velocity: number) => {
	return Math.abs(offset) * velocity;
};

// Memoize CarouselSlide to prevent unnecessary re-renders
const MemoizedCarouselSlide = React.memo(CarouselSlide);

// Memoize Slider to prevent unnecessary re-renders
const MemoizedSlider = React.memo(Slider);

const Carousel = ({
	content,
	onChange,
}: {
	content: BaseItemDto[];
	onChange: (currentSlide: number) => void;
}) => {
	const [currentSlide, setCurrentSlide] = useState(0);

	const [setDirection] = useCarouselStore((state) => [state.setDirection]);

	useEffect(() => {
		onChange(currentSlide);
	}, [content[currentSlide]?.Id]);

	const api = useApiInContext((s) => s.api);

	// Memoize the content mapping
	const sliderContent = useMemo(() => {
		return content.map((item, index) => {
			return (
				<motion.div
					className={
						currentSlide === index
							? "carousel-indicator active"
							: "carousel-indicator"
					}
					layout
					initial={{
						height: "4.6em",
					}}
					whileHover={{
						height: "5.5em",
					}}
					transition={{
						duration: 0.05,
					}}
					key={item.Id}
					onClick={() => {
						if (currentSlide > index) {
							setDirection("left");
						} else if (currentSlide <= index) {
							setDirection("right");
						}
						setCurrentSlide(index);
					}}
				>
					{item.ImageTags?.Thumb ? (
						<img
							src={
								api &&
								getImageUrlsApi(api).getItemImageUrlById(
									item.Id ?? "",
									"Thumb",
									{
										tag: item.ImageTags.Primary,
										fillWidth: 300,
									},
								)
							}
							alt={item.Name ?? "item-image"}
							className="carousel-indicator-image"
						/>
					) : (
						<div className="carousel-indicator-icon">
							{getTypeIcon(item.Type ?? "Movie")}
						</div>
					)}
				</motion.div>
			);
		});
	}, [content, currentSlide, api, setDirection]);

	const handleDragEnd = useCallback(
		(
			_: MouseEvent | TouchEvent | PointerEvent,
			{ offset, velocity }: PanInfo,
		) => {
			const swipe = swipePower(offset.x, velocity.x);
			if (
				currentSlide !== content.length - 1 &&
				swipe < -swipeConfidenceThreshold
			) {
				setDirection("right");
				setCurrentSlide((init) => init + 1);
			} else if (currentSlide !== 0 && swipe > swipeConfidenceThreshold) {
				setDirection("left");
				setCurrentSlide((init) => init - 1);
			}
		},
		[currentSlide, content.length, setDirection],
	);

	return (
		<div className="carousel">
			<AnimatePresence mode="sync">
				<motion.div
					key={currentSlide}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{
						duration: 0.25,
						ease: "linear",
					}}
					drag={"x"}
					dragConstraints={{ left: 0, right: 0 }}
					dragElastic={1}
					//@ts-ignore
					onDragEnd={handleDragEnd}
					style={{
						height: "100%",
						width: "100%",
						position: "absolute",
					}}
				>
					<MemoizedCarouselSlide
						item={content[currentSlide]}
						key={content[currentSlide].Id}
					/>
				</motion.div>
			</AnimatePresence>
			<MemoizedSlider currentSlide={currentSlide} content={sliderContent} />
		</div>
	);
};

export default React.memo(Carousel);
