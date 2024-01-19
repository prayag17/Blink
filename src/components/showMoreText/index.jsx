import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";

const ShowMoreText = ({ content, collapsedLines, extraProps }) => {
	const [displayFull, setDisplayFull] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const textRef = useRef(null);

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
			}}
		>
			<Typography
				ref={textRef}
				key={displayFull}
				style={{
					display: "-webkit-box",
					textOverflow: "ellipsis",
					overflow: "hidden",
					WebkitLineClamp: displayFull ? "none" : collapsedLines ?? 2,
					WebkitBoxOrient: "vertical",
					width: "100%",
				}}
			>
				{content}
			</Typography>
			{content.length > 0 && isOverflowing && (
				<Button
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
