import { useEffect, useMemo, useState } from "react";

const useIntersecting = (ref) => {
	const [isIntersecting, setIntersecting] = useState(false);

	const observer = useMemo(
		() =>
			new IntersectionObserver(([entry]) =>
				setIntersecting(entry.isIntersecting),
			),
	);

	useEffect(() => {
		observer.observe(ref.current);
		return () => observer.disconnect();
	});

	return isIntersecting;
};

export default useIntersecting;
