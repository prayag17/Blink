import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

import IconButton from "@mui/material/IconButton";

import { useCarouselStore } from "../../utils/store/carousel";
import "./carousel.scss";
import { useApiInContext } from "@/utils/store/api";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import CarouselSlide from "../carouselSlide";

import ReactMultiCarousel from "react-multi-carousel";
import Slider from "../Slider";
import { getTypeIcon } from "../utils/iconsCollection";

const swipeConfidenceThreshold = 8000;
const swipePower = (offset, velocity) => {
	return Math.abs(offset) * velocity;
};

const Carousel = ({
	content,
	onChange,
}: {
	content: BaseItemDto[];
	onChange: () => void;
}) => {
	const [currentSlide, setCurrentSlide] = useState(0);

	const [setDirection, dir] = useCarouselStore((state) => [
		state.setDirection,
		state.direction,
	]);
	useEffect(() => {
		onChange(currentSlide);
	}, [content[currentSlide]?.Id]);

	const api = useApiInContext((s) => s.api);

	const responsive = {
		superLargeDesktop: {
			// the naming can be any, depends on you.
			breakpoint: { max: 4000, min: 3000 },
			items: 6,
		},
		desktop: {
			breakpoint: { max: 3000, min: 1024 },
			items: 6,
		},
		tablet: {
			breakpoint: { max: 1024, min: 464 },
			items: 4,
		},
		mobile: {
			breakpoint: { max: 464, min: 0 },
			items: 1,
		},
	};

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
					onDragEnd={(e, { offset, velocity }) => {
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
					}}
					style={{
						height: "100%",
						width: "100%",
						position: "absolute",
					}}
				>
					<CarouselSlide
						item={content[currentSlide]}
						key={content[currentSlide].Id}
					/>
				</motion.div>
			</AnimatePresence>
			<Slider
				currentSlide={currentSlide}
				content={content.map((item, index) => (
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
						{item.ImageTags?.Primary ? (
							<img
								src={api.getItemImageUrl(item.Id, "Thumb", {
									tag: item.ImageTags.Primary,
									fillWidth: 300,
								})}
								alt={item.Name ?? "item-image"}
								className="carousel-indicator-image"
							/>
						) : (
							<div className="carousel-indicator-icon">
								{getTypeIcon(item.Type)}
							</div>
						)}
					</motion.div>
				))}
			/>
		</div>
	);
};

export default Carousel;
