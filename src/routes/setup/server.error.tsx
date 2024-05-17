import { createFileRoute } from "@tanstack/react-router";
import React from "react";

export const Route = createFileRoute("/setup/server/error")({
	component: () => <div>Hello /setup/server/error!</div>,
});