import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import { useEffect, useRef, useState } from "react";

const ShowMoreText = ({
	content,
	collapsedLines,
	extraProps,
}: {
	content: string;
	collapsedLines: number;
	extraProps?: Record<string, any>;
}) => {
	const [displayFull, setDisplayFull] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const textRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (textRef.current) {
			if (textRef.current.offsetHeight < textRef.current.scrollHeight) {
				setIsOverflowing(true);
			} else {
				setIsOverflowing(false);
			}
			// textRef.current.
		}
	}, []);
	return (
		<div
			className="flex flex-column"
			{...extraProps}
			style={{
				alignItems: "flex-end",
				gap: "1em",
				opacity: 0.8,
			}}
		>
			<Typography
				ref={textRef}
				key={displayFull ? "full" : "collapsed"}
				style={{
					display: "-webkit-box",
					textOverflow: "ellipsis",
					overflow: "hidden",
					WebkitLineClamp: displayFull ? "none" : (collapsedLines ?? 2),
					WebkitBoxOrient: "vertical",
					width: "100%",
				}}
				variant="subtitle2"
				fontWeight={300}
			>
				{content}
			</Typography>
			{content.length > 0 && isOverflowing && (
				<Button
					//@ts-ignore
					color="white"
					variant="outlined"
					onClick={() => setDisplayFull((state) => !state)}
					// key={displayFull}
				>
					{displayFull ? "Show less" : "Show more"}
				</Button>
			)}
		</div>
	);
};
export default ShowMoreText;
