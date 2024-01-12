import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

import IconButton from "@mui/material/IconButton";

import { useCarouselStore } from "../../utils/store/carousel";
import "./carousel.scss";

const swipeConfidenceThreshold = 8000;
const swipePower = (offset, velocity) => {
	return Math.abs(offset) * velocity;
};

const Carousel = ({ content, onChange }) => {
	const [currentSlide, setCurrentSlide] = useState(0);

	const [setDirection, dir] = useCarouselStore((state) => [
		state.setDirection,
		state.direction,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		onChange(currentSlide);
	}, [content[currentSlide]?.key]);

	return (
		<div className="carousel">
			<IconButton
				className="carousel-button left"
				onClick={() => {
					if (currentSlide === 0) {
						setDirection("left");
						setCurrentSlide(content.length - 1);
					}
					if (currentSlide > 0) {
						setDirection("left");
						setCurrentSlide((init) => init - 1);
					}
				}}
				sx={{
					background: " rgb(200 200 200 / 0.05)",
				}}
				// disabled={currentSlide == 0}
			>
				<div className="material-symbols-rounded">arrow_left</div>
			</IconButton>
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
					{content[currentSlide]}
				</motion.div>
			</AnimatePresence>
			<IconButton
				className="carousel-button right"
				onClick={() => {
					if (currentSlide === content.length - 1) {
						setDirection("right");
						setCurrentSlide(0);
					} else if (currentSlide < content.length - 1) {
						setDirection("right");
						setCurrentSlide((init) => init + 1);
					}
				}}
				// disabled={currentSlide == content.length - 1}
				sx={{
					background: " rgb(200 200 200 / 0.05)",
				}}
			>
				<div className="material-symbols-rounded">arrow_right</div>
			</IconButton>
			<div className="carousel-indicator-container">
				{content.map((item, index) => (
					<div
						className={
							currentSlide === index
								? "carousel-indicator active"
								: "carousel-indicator"
						}
						key={item.Id}
						onClick={() => {
							if (currentSlide > index) {
								setDirection("left");
							} else if (currentSlide <= index) {
								setDirection("right");
							}
							setCurrentSlide(index);
						}}
					/>
				))}
			</div>
		</div>
	);
};

export default Carousel;
