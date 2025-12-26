import IconButton from "@mui/material/IconButton";
import type { ReactNode } from "react";
import React from "react";
import QueueButton from "@/components/buttons/queueButton";

interface PlayerActionsProps {
	onNavigate: () => void;
	onClose: () => void;
	children?: ReactNode;
}

const PlayerActions = ({
	onNavigate,
	onClose,
	children,
}: PlayerActionsProps) => {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-end",
			}}
		>
			<IconButton onClick={onNavigate}>
				<span className="material-symbols-rounded">info</span>
			</IconButton>
			<QueueButton />
			{children}
			<IconButton onClick={onClose}>
				<div className="material-symbols-rounded">close</div>
			</IconButton>
		</div>
	);
};

export default PlayerActions;
