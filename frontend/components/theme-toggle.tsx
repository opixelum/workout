"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		const savedTheme = window.localStorage.getItem("theme");
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;
		setIsDark(shouldUseDark);
		document.documentElement.classList.toggle("dark", shouldUseDark);
	}, []);

	const toggleTheme = () => {
		const next = !isDark;
		setIsDark(next);
		document.documentElement.classList.toggle("dark", next);
		window.localStorage.setItem("theme", next ? "dark" : "light");
	};

	return (
		<Button variant="outline" onClick={toggleTheme}>
			{isDark ? "Light mode" : "Dark mode"}
		</Button>
	);
}
