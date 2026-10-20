import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React, { useState } from "react";
import QueueView from "@/components/queue/queueView";

/** Opens the play queue in a side drawer. */
const QueueButton = () => {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Tooltip title="Queue">
				<IconButton onClick={() => setOpen(true)} aria-label="Open queue">
					<span className="material-symbols-rounded">queue_music</span>
				</IconButton>
			</Tooltip>
			<Drawer
				anchor="right"
				open={open}
				onClose={() => setOpen(false)}
				slotProps={{
					backdrop: { sx: { backgroundColor: "rgb(0 0 0 / 0.3)" } },
					paper: { className: "queue-drawer-paper" },
				}}
			>
				<QueueView variant="drawer" onClose={() => setOpen(false)} />
			</Drawer>
		</>
	);
};

export default QueueButton;
