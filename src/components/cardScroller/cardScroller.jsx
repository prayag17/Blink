import PropTypes from "prop-types";
import React, { useState } from "react";

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import Box from "@mui/material/Box";
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import "./cardScroller.module.scss";
export const CardScroller = ({
	children,
	displayCards,
	title,
	headingProps,
	disableDecoration = false,
	boxProps,
}) => {
	const responsive = {
		superLargeDesktop: {
			// the naming can be any, depends on you.
			breakpoint: { max: 4000, min: 3000 },
			items: displayCards + 1,
			slidesToSlide: displayCards + 1,
			partialVisibilityGutter: 40,
		},
		desktop: {
			breakpoint: { max: 3000, min: 925 },
			items: displayCards,
			slidesToSlide: displayCards, // optional, default to 1.
			partialVisibilityGutter: 30,
		},
		tablet: {
			breakpoint: { max: 925, min: 600 },
			items: displayCards - 3,
			slidesToSlide: displayCards - 3, // optional, default to 1.
			partialVisibilityGutter: 20,
		},
		mobile: {
			breakpoint: { max: 600, min: 424 },
			items: displayCards - 5,
			slidesToSlide: displayCards - 5, // optional, default to 1.
			partialVisibilityGutter: 10,
		},
		smallScreen: {
			breakpoint: { max: 424, min: 0 },
			items: 1,
			slidesToSlide: 1, // optional, default to 1.
			partialVisibilityGutter: 10,
		},
	};

	const [carouselRef, setCarouselRef] = useState();

	return (
		<Box {...boxProps} className="card-scroller-container" mb={1}>
			<Box
				sx={{ mb: 1 }}
				className={
					disableDecoration
						? "card-scroller-header-container hidden-decoration"
						: "card-scroller-header-container"
				}
			>
				<Typography
					variant="h5"
					color="textPrimary"
					className="card-scroller-heading"
					{...headingProps}
				>
					<div className="card-scroller-heading-decoration" /> {title}
				</Typography>
				<ButtonGroup className="card-scroller-button-group">
					<IconButton
						className="card-scroller-button"
						onClick={() => carouselRef.previous()}
					>
						<div className="material-symbols-rounded">chevron_left</div>
					</IconButton>
					<IconButton
						className="card-scroller-button"
						onClick={() => carouselRef.next()}
					>
						<div className="material-symbols-rounded">chevron_right</div>
					</IconButton>
				</ButtonGroup>
			</Box>
			<Carousel
				swipeable={false}
				draggable={false}
				responsive={responsive}
				arrows={false}
				ref={(el) => setCarouselRef(el)}
				className="card-scroller"
				customTransition="all .6s"
				transitionDuration={600}
			>
				{children}
			</Carousel>
		</Box>
	);
};

CardScroller.propTypes = {
	displayCards: PropTypes.number.isRequired,
	title: PropTypes.string.isRequired,
	headingProps: PropTypes.any,
};
