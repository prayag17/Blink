import { useEffect, useRef } from "react";

function useInterval(callback: () => void, delay: number) {
	const savedCallback = useRef<null | (() => void)>(null);

	// Remember the latest callback.
	useEffect(() => {
		if (savedCallback.current) {
			savedCallback.current = callback;
		}
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			if (savedCallback.current) {
				savedCallback.current();
			}
		}
		if (delay !== null) {
			const id = setInterval(tick, delay);
			return () => clearInterval(id);
		}
	}, [delay]);
}

export default useInterval;