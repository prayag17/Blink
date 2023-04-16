/** @format */
import React from "react";
import { NavLink as NavLinkBase } from "react-router-dom";

export const NavLink = React.forwardRef((props, ref) => (
	<NavLinkBase ref={ref} {...props} className={props.activeClassName} />
));
