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

	const [setDirection] = useCarouselStore((state) => [state.setDirection]);

	useEffect(() => {
		onChange(currentSlide);
	}, [content[currentSlide]?.Id]);

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
		<div className="carousel">
			<AnimatePresence mode="sync">
				<MemoizedCarouselSlide
					item={content[currentSlide]}
					key={content[currentSlide].Id}
				/>
			</AnimatePresence>
			<div className="carousel-sidebar">
				{content.map((item, index) => (
					<CarouselTickers
						key={item.Id}
						imageUrl={
							getImageUrlsApi(api).getItemImageUrlById(
								item.Id ?? "",
								"Primary",
								{
									quality: 90,
									fillWidth: 360,
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
				))}
			</div>
		</div>
	);
};

export default React.memo(Carousel);
