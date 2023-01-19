/** @format */

import { useRef, useEffect } from "react";
import PropTypes from "prop-types";

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import ChevronLeft from "mdi-material-ui/ChevronLeft";
import ChevronRight from "mdi-material-ui/ChevronRight";

import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";

import "./cardScroller.module.scss";

const CarouselButton = styled(Button)(() => ({
	color: "white",
	height: "100%",
}));

const SliderButtonRight = ({ onClick }) => {
	return (
		<CarouselButton
			onClick={() => onClick()}
			className="card-scroller-button right"
			variant="text"
		>
			<ChevronRight />
		</CarouselButton>
	);
};

const SliderButtonLeft = ({ onClick }) => {
	return (
		<CarouselButton
			onClick={() => onClick()}
			className="card-scroller-button left"
			variant="text"
		>
			<ChevronLeft />
		</CarouselButton>
	);
};

export const CardScroller = ({ children, displayCards }) => {
	const responsive = {
		desktop: {
			breakpoint: { max: 3000, min: 1024 },
			items: displayCards,
			slidesToSlide: displayCards, // optional, default to 1.
		},
		tablet: {
			breakpoint: { max: 1024, min: 464 },
			items: displayCards - 1,
			slidesToSlide: displayCards - 1, // optional, default to 1.
		},
		mobile: {
			breakpoint: { max: 464, min: 0 },
			items: displayCards - 2,
			slidesToSlide: displayCards - 2, // optional, default to 1.
		},
	};

	return (
		<Carousel
			swipeable={false}
			draggable={false}
			responsive={responsive}
			arrows={true}
			customRightArrow={<SliderButtonRight />}
			customLeftArrow={<SliderButtonLeft />}
			className="card-scroller"
		>
			{children}
		</Carousel>
	);
};

CardScroller.propTypes = {
	displayCards: PropTypes.number.isRequired,
};
