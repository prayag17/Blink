import {
	ListItem,
	ListItemButton,
	type ListItemProps,
	ListItemText,
} from "@mui/material";
import { createLink, Link } from "@tanstack/react-router";
import React, { forwardRef, type ReactNode } from "react";

interface MUIListItemLinkProps extends ListItemProps<"a"> {
	icon?: ReactNode;
	primary: string;
	className?: string;
}

const CreatedListItemLink = forwardRef<HTMLAnchorElement, MUIListItemLinkProps>(
	(props, ref) => (
		<ListItem component="a" ref={ref} {...props}>
			<ListItemButton
				style={{
					borderRadius: "100px",
					gap: "0.85em",
					color: "white",
					textDecoration: "none",
				}}
			>
				<div className="material-symbols-rounded">{props.icon}</div>
				<ListItemText primary={props.primary} />
			</ListItemButton>
		</ListItem>
	),
);

const ListItemLink = createLink(CreatedListItemLink);

export default ListItemLink;

/* export default function ListItemLink(props: ListItemLinkProps) {
	const { icon, primary, to, className } = props;

	return (
		<li>
			{/* @ts-ignore /*}
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
 */
