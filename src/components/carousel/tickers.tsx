import type { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { Typography } from "@mui/material";
import React from "react";
import { getTypeIcon } from "../utils/iconsCollection";

type CarouselTickersProps = {
	imageUrl?: string | undefined | null;
	itemName: string;
	itemYear: string;
	onTickerClick: (index: number) => void;
	index: number;
	isActive: boolean;
	itemType: BaseItemKind;
};

const CarouselTickers = React.memo(
	({
		imageUrl,
		itemName,
		itemYear,
		onTickerClick,
		index,
		isActive,
		itemType,
	}: CarouselTickersProps) => {
		const handleClick = React.useCallback(() => {
			onTickerClick(index);
		}, [index, onTickerClick]);

		return (
			<div
				className={`carousel-ticker${isActive ? " active" : ""}`}
				onClick={handleClick}
			>
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={itemName}
						className="carousel-ticker-image"
					/>
				) : (
					<div className="carousel-ticker-image placeholder material-symbols-rounded">
						{" "}
						{getTypeIcon(itemType)}
					</div>
				)}
				<div>
					<Typography variant="subtitle1" className="carousel-ticker-title">
						{itemName}
					</Typography>
					<Typography variant="caption" className="carousel-ticker-year">
						{itemYear}
					</Typography>
				</div>
			</div>
		);
	},
);
export default CarouselTickers;
