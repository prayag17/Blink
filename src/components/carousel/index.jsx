/** @format */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import IconButton from "@mui/material/IconButton";
import { MdiChevronLeft } from "../icons/mdiChevronLeft";
import { MdiChevronRight } from "../icons/mdiChevronRight";

import "./carousel.scss";
import { useCarouselStore } from "../../utils/store/carousel";

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
	useEffect(() => {
		onChange(currentSlide);
	}, [currentSlide]);

	return (
		<div className="carousel">
			<IconButton
				className="carousel-button left"
				onClick={() => {
					if (currentSlide > 0) {
						setDirection("left");
						setCurrentSlide((init) => init - 1);
					}
				}}
				sx={{
					background: " rgb(200 200 200 / 0.05)",
				}}
				disabled={currentSlide == 0}
			>
				<MdiChevronLeft />
			</IconButton>
			<AnimatePresence>
				<motion.div
					key={currentSlide}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{
						duration: 0.25,
						ease: "easeInOut",
					}}
					drag={"x"}
					dragConstraints={{ left: 0, right: 0 }}
					dragElastic={1}
					onDragEnd={(e, { offset, velocity }) => {
						const swipe = swipePower(offset.x, velocity.x);
						if (
							currentSlide != content.length - 1 &&
							swipe < -swipeConfidenceThreshold
						) {
							setDirection("right");
							setCurrentSlide((init) => init + 1);
						} else if (
							currentSlide != 0 &&
							swipe > swipeConfidenceThreshold
						) {
							setDirection("left");
							setCurrentSlide((init) => init - 1);
						}
					}}
					style={{
						height: "100vh",
						width: "100vw",
						position: "absolute",
					}}
				>
					{content[currentSlide]}
				</motion.div>
			</AnimatePresence>
			<IconButton
				className="carousel-button right"
				onClick={() => {
					if (currentSlide < content.length - 1) {
						setDirection("right");
						setCurrentSlide((init) => init + 1);
					}
				}}
				disabled={currentSlide == content.length - 1}
				sx={{
					background: " rgb(200 200 200 / 0.05)",
				}}
			>
				<MdiChevronRight />
			</IconButton>
			<div className="carousel-indicator-container">
				<div
					className={
						currentSlide == 0
							? "carousel-indicator active"
							: "carousel-indicator"
					}
					style={{
						background:
							currentSlide == 0
								? "white"
								: "rgb(255 255 255 / 0.5)",
					}}
					onClick={() => {
						setDirection("left");
						setCurrentSlide(0);
					}}
				/>
				{content.map((item, index) => (
					<div
						className={
							currentSlide == index + 1
								? "carousel-indicator active"
								: "carousel-indicator"
						}
						key={index}
						style={{
							background:
								currentSlide == index + 1
									? "white"
									: "rgb(255 255 255 / 0.5)",
						}}
						onClick={() => {
							if (currentSlide > index) {
								setDirection("left");
							} else if (currentSlide <= index) {
								setDirection("right");
							}
							setCurrentSlide(index + 1);
						}}
					/>
				))}
			</div>
		</div>
	);
};

export default Carousel;
