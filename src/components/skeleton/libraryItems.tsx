import { Skeleton } from "@mui/material";
import React from "react";

const LibraryItemsSkeleton = () => {
	return (
		<div
			style={{
				display: "flex",
				width: "100%",
				overflow: "visible",
				flexWrap: "wrap",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{Array.from(new Array(18)).map((item, index) => (
				<Skeleton
					key={index}
					variant="rounded"
					sx={{
						flexBasis: 185,
						height: "auto",
						aspectRatio: 0.6666,
						// background: "red",
						marginRight: "1.5em",
						marginBottom: "1.5em",
						flexShrink: 1,
						flexGrow: 0,
						borderRadius: "10px",
					}}
				/>
			))}
		</div>
	);
};

export default LibraryItemsSkeleton;