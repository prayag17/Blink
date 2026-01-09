import { Typography } from "@mui/material";
import React from "react";

type CarouselTickersProps = {
	imageUrl?: string;
	itemName: string;
	itemYear: string;
	onClick: () => void;
	isActive: boolean;
};

const CarouselTickers = ({
	imageUrl,
	itemName,
	itemYear,
	onClick,
	isActive,
}: CarouselTickersProps) => {
	return (
		<div
			className={`carousel-ticker${isActive ? " active" : ""}`}
			onClick={onClick}
		>
			<img
				src={imageUrl}
				alt={itemName}
				className="carousel-ticker-image"
				// style={{ width: "5em", height: "100%", objectFit: "cover" }}
			/>
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
};
export default CarouselTickers;
