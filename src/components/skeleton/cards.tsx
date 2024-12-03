import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import React from "react";

export const CardsSkeleton = () => {
	return (
		<div
			style={{
				display: "flex",
				flexFlow: "column",
				marginBottom: "2em",
			}}
		>
			<Typography variant="h3" sx={{ mb: "0.15em" }}>
				<Skeleton width="35%" />
			</Typography>
			<div className="flex flex-align-center" style={{ height: "17em" }}>
				{Array.from({ length: 12 }).map((_, index) => (
					<Skeleton
						height="26em"
						sx={{
							flex: "1 0 12.45%",
							marginRight: "1.5em",
							borderRadius: "10px",
							animationDelay: `${index * 0.25}s`,
						}}
						// biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton component
						key={index}
					/>
				))}
			</div>
		</div>
	);
};
