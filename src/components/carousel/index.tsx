import { AnimatePresence } from "motion/react";
import React, { useCallback, useEffect, useState } from "react";

import { useCarouselStore } from "../../utils/store/carousel";
import "./carousel.scss";
import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import CarouselSlide from "../carouselSlide";
import CarouselTickers from "./tickers";

// Memoize CarouselSlide to prevent unnecessary re-renders
const MemoizedCarouselSlide = React.memo(CarouselSlide);

const Carousel = ({
	content,
	onChange,
}: {
	content: BaseItemDto[];
	onChange: (currentSlide: number) => void;
}) => {
	const [currentSlide, setCurrentSlide] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const sidebarRef = React.useRef<HTMLDivElement>(null);
	const tickerRefs = React.useRef<(HTMLDivElement | null)[]>([]);

	const [setDirection] = useCarouselStore((state) => [state.setDirection]);

	useEffect(() => {
		onChange(currentSlide);

		// Auto-scroll sidebar to keep active item in view
		if (tickerRefs.current[currentSlide]) {
			tickerRefs.current[currentSlide]?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [currentSlide, content, onChange]);

	// Autoplay functionality
	useEffect(() => {
		if (isPaused || content.length === 0) return;

		const timer = setInterval(() => {
			setDirection("right");
			setCurrentSlide((prev) => (prev + 1) % content.length);
		}, 8000);

		return () => clearInterval(timer);
	}, [isPaused, content.length, setDirection, currentSlide]);

	const api = useApiInContext((s) => s.api);

	const handleTickerClick = useCallback(
		(index: number) => {
			if (index === currentSlide) return;
			setDirection(index > currentSlide ? "right" : "left");
			setCurrentSlide(index);
		},
		[currentSlide, setDirection],
	);

	if (!api) return null;

	return (
		<div
			className={`carousel ${isPaused ? "paused" : ""}`}
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
		>
			<AnimatePresence mode="sync">
				<MemoizedCarouselSlide
					item={content[currentSlide]}
					key={content[currentSlide].Id}
				/>
			</AnimatePresence>
			<div className="carousel-sidebar" ref={sidebarRef}>
				{content.map((item, index) => (
					<div
						key={item.Id}
						ref={(el) => {
							tickerRefs.current[index] = el;
						}}
						style={{ scrollMarginBlock: "24px" }}
					>
						<CarouselTickers
							imageUrl={
								getImageUrlsApi(api).getItemImageUrlById(
									item.Id ?? "",
									"Thumb",
									{
										quality: 90,
										fillHeight: 360,
									},
								) ?? undefined
							}
							isActive={index === currentSlide}
							itemName={item.Name ?? "Unknown"}
							itemYear={
								item.Type === BaseItemKind.Series && item.EndDate
									? `${item.ProductionYear ?? ""} - ${new Date(item.EndDate).getFullYear().toString()}`
									: (item.ProductionYear?.toString() ?? "")
							}
							onClick={() => handleTickerClick(index)}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default React.memo(Carousel);
