import { IconButton } from "@mui/material";
import { useRouter } from "@tanstack/react-router";
import React from "react";

export default function BackButton() {
	const { history } = useRouter();
	const handleClick = () => {
		history.back();
	};

	return (
		<IconButton onClick={handleClick}>
			<span className="material-symbols-rounded">arrow_back</span>
		</IconButton>
	);
}