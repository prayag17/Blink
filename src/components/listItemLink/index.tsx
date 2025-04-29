import { ListItem, ListItemButton, ListItemText } from "@mui/material";
import { Link, type ReactNode } from "@tanstack/react-router";
import React from "react";

interface ListItemLinkProps {
	icon?: ReactNode;
	primary: string;
	to: string;
	className?: string;
}
export default function ListItemLink(props: ListItemLinkProps) {
	const { icon, primary, to, className } = props;

	return (
		<li>
			{/* @ts-ignore */}
			<ListItem
				component={Link}
				activeClassName="active"
				className={className}
				to={to}
			>
				<ListItemButton
					style={{
						borderRadius: "100px",
						gap: "0.85em",
						color: "white",
						textDecoration: "none",
					}}
				>
					<div className="material-symbols-rounded">{icon}</div>
					<ListItemText primary={primary} />
				</ListItemButton>
			</ListItem>
		</li>
	);
}
