/** @format */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { MdiChevronLeft } from "../icons/mdiChevronLeft";
import { MdiChevronRight } from "../icons/mdiChevronRight";

import "./carousel.scss";
import { useCarouselStore } from "../../utils/store/carousel";

const swipeConfidenceThreshold = 10000;
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
		<Box className="carousel" position="relative" height="100vh">
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
						duration: 0.5,
					}}
					drag="x"
					dragConstraints={{ left: 0, right: 0 }}
					dragElastic={1}
					onDragEnd={(e, { offset, velocity }) => {
						const swipe = swipePower(offset.x, velocity.x);

						if (swipe < -swipeConfidenceThreshold) {
							setDirection("right");
							setCurrentSlide((init) => init + 1);
						} else if (swipe > swipeConfidenceThreshold) {
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
			<Box className="carousel-indicator-container">
				<Box
					className="carousel-indicator"
					sx={{
						background:
							currentSlide == 0
								? "white"
								: "rgb(255 255 255 / 0.5)",
					}}
					onClick={() => setCurrentSlide(0)}
				/>
				{content.map((item, index) => (
					<Box
						className="carousel-indicator"
						key={index}
						sx={{
							background:
								currentSlide == index + 1
									? "white"
									: "rgb(255 255 255 / 0.5)",
						}}
						onClick={() => setCurrentSlide(index + 1)}
					/>
				))}
			</Box>
		</Box>
	);
};

export default Carousel;
