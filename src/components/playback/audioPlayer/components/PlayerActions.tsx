import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React, { type ReactNode } from "react";
import QueueButton from "@/components/buttons/queueButton";

interface PlayerActionsProps {
	/** Opens the full-screen player. */
	onExpand: () => void;
	onClose: () => void;
	/** Volume control, rendered between the queue and expand buttons. */
	children?: ReactNode;
}

const PlayerActions = ({ onExpand, onClose, children }: PlayerActionsProps) => {
	return (
		<div className="audio-player-actions">
			<QueueButton />
			<div className="audio-player-volume">{children}</div>
			<Tooltip title="Open player">
				<IconButton onClick={onExpand} aria-label="Open player">
					<span className="material-symbols-rounded">open_in_full</span>
				</IconButton>
			</Tooltip>
			<Tooltip title="Stop and close">
				<IconButton onClick={onClose} aria-label="Stop and close">
					<span className="material-symbols-rounded">close</span>
				</IconButton>
			</Tooltip>
		</div>
	);
};

export default PlayerActions;
