import { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import React, { type ReactNode, useEffect } from "react";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop";

import "./loginShell.scss";

type LoginShellProps = {
	title: ReactNode;
	subtitle?: ReactNode;
	/** Max width of the content column. */
	width?: "narrow" | "wide";
	children: ReactNode;
	footer?: ReactNode;
};

/** Shared full-screen layout for the sign-in pages. */
const LoginShell = ({
	title,
	subtitle,
	width = "narrow",
	children,
	footer,
}: LoginShellProps) => {
	const api = useApiInContext((s) => s.api);

	const serverInfo = useQuery({
		queryKey: ["login", "serverInfo"],
		queryFn: async () =>
			api ? (await getSystemApi(api).getPublicSystemInfo()).data : null,
		enabled: Boolean(api),
		staleTime: 5 * 60_000,
	});
	const branding = useQuery({
		queryKey: ["login", "branding"],
		queryFn: async () =>
			api ? (await getBrandingApi(api).getBrandingOptions()).data : null,
		enabled: Boolean(api),
		staleTime: 5 * 60_000,
	});

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);
	useEffect(() => {
		setBackdrop("");
	}, [setBackdrop]);

	const serverName = serverInfo.data?.ServerName;
	const serverHost = api?.basePath.replace(/^https?:\/\//, "");

	return (
		<div className="login-shell scrollY">
			<div className={`login-shell-content login-shell-${width}`}>
				{serverHost && (
					<div className="login-shell-server">
						<span className="material-symbols-rounded">dns</span>
						<span className="login-shell-server-name" title={serverHost}>
							{serverName ?? serverHost}
						</span>
						<Link to="/setup/server/list" className="login-shell-server-change">
							Change
						</Link>
					</div>
				)}

				<header className="login-shell-header">
					<h1 className="login-shell-title">{title}</h1>
					{subtitle && <p className="login-shell-subtitle">{subtitle}</p>}
				</header>

				<main className="login-shell-body">{children}</main>

				{footer && <footer className="login-shell-footer">{footer}</footer>}

				{branding.data?.LoginDisclaimer && (
					<aside className="login-shell-disclaimer">
						<span className="material-symbols-rounded">info</span>
						<p>{branding.data.LoginDisclaimer}</p>
					</aside>
				)}
			</div>
		</div>
	);
};

export default LoginShell;
