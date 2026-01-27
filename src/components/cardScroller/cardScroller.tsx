import React, { type ReactNode, useRef, useState } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import { Box } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import "./cardScroller.scss";

// Custom Header + Button Group component
const ScrollerHeader = ({
	onNext,
	onPrevious,
	title,
	headingProps,
	disableDecoration,
	currentSlide = 0,
	isNextDisabled = false,
}: any) => {
	// Basic disable logic for visual feedback
	const isFirst = currentSlide === 0;

	return (
		<div
			className={`card-scroller-header-container ${disableDecoration ? "hidden-decoration" : ""}`}
		>
			<Typography
				variant="h5"
				color="textPrimary"
				className="card-scroller-heading"
				{...headingProps}
			>
				<div className="card-scroller-heading-decoration" />
				{title}
			</Typography>

			<div className="card-scroller-controls">
				<IconButton
					onClick={onPrevious}
					disabled={isFirst}
					size="small"
					className="scroller-nav-btn"
				>
					<span className="material-symbols-rounded">chevron_left</span>
				</IconButton>
				<IconButton
					onClick={onNext}
					disabled={isNextDisabled}
					size="small"
					className="scroller-nav-btn"
				>
					<span className="material-symbols-rounded">chevron_right</span>
				</IconButton>
			</div>
		</div>
	);
};

type CardScrollerProps = {
	children: ReactNode;
	displayCards: number;
	title: string;
	headingProps?: object;
	disableDecoration?: boolean;
	boxProps?: object;
};

export default function CardScroller({
	children,
	displayCards,
	title,
	headingProps,
	disableDecoration = false,
	boxProps,
}: CardScrollerProps) {
	const carouselRef = useRef<any>(null);
	const [currentSlide, setCurrentSlide] = useState(0);
	const [slidesToShow, setSlidesToShow] = useState(displayCards);
	const totalItems = React.Children.count(children);

	const responsive = {
		superLargeDesktop: {
			breakpoint: { max: 4000, min: 3000 },
			items: displayCards + 1,
			slidesToSlide: displayCards + 1,
			partialVisibilityGutter: 40,
		},
		desktop: {
			breakpoint: { max: 3000, min: 925 },
			items: displayCards,
			slidesToSlide: displayCards,
			partialVisibilityGutter: 30,
		},
		tablet: {
			breakpoint: { max: 925, min: 600 },
			items: displayCards - 3,
			slidesToSlide: displayCards - 3,
			partialVisibilityGutter: 20,
		},
		mobile: {
			breakpoint: { max: 600, min: 424 },
			items: displayCards - 5,
			slidesToSlide: displayCards - 5,
			partialVisibilityGutter: 10,
		},
		smallScreen: {
			breakpoint: { max: 424, min: 0 },
			items: 1,
			slidesToSlide: 1,
			partialVisibilityGutter: 10,
		},
	};

	const handleNext = () => {
		if (carouselRef.current) {
			carouselRef.current.next();
		}
	};

	const handlePrevious = () => {
		if (carouselRef.current) {
			carouselRef.current.previous();
		}
	};

	return (
		<div {...boxProps} className="card-scroller-container">
			<ScrollerHeader
				title={title}
				headingProps={headingProps}
				disableDecoration={disableDecoration}
				onNext={handleNext}
				onPrevious={handlePrevious}
				currentSlide={currentSlide}
				isNextDisabled={currentSlide + slidesToShow >= totalItems}
			/>
			<Carousel
				ref={carouselRef}
				swipeable
				draggable
				responsive={responsive}
				arrows={false}
				className="card-scroller"
				customTransition="transform 400ms ease-in-out"
				transitionDuration={400}
				containerClass="card-scroller-track"
				itemClass="card-scroller-item"
				beforeChange={(nextSlide, state) => {
					setCurrentSlide(nextSlide);
					setSlidesToShow(state.slidesToShow);
				}}
			>
				{children}
			</Carousel>
		</div>
	);
}
