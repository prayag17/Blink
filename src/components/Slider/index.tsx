import useDebounce from "@/utils/hooks/useDebounce";
import React, {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { useSpring } from "@react-spring/web";
import { debounce } from "lodash";

import "./style.scss";
import { Button, IconButton } from "@mui/material";

enum Direction {
	RIGHT = 0,
	LEFT = 1,
}

const Slider = ({
	content,
	currentSlide,
}: { content: ReactNode[]; currentSlide: number }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [scrollPos, setScrollPos] = useState({ isStart: true, isEnd: false });

	const handleScroll = useCallback(() => {
		const scrollWidth = containerRef.current?.scrollWidth ?? 0;
		const clientWidth =
			containerRef.current?.getBoundingClientRect().width ?? 0;
		const scrolledPostion = containerRef.current?.scrollLeft ?? 0;
		if (content.length === 0) {
			setScrollPos({ isStart: true, isEnd: true });
		} else if (clientWidth >= scrollWidth) {
			setScrollPos({ isStart: true, isEnd: true });
		} else if (
			scrolledPostion >=
			(containerRef.current?.scrollWidth ?? 0) - clientWidth
		) {
			setScrollPos({ isStart: false, isEnd: true });
		} else if (scrolledPostion > 0) {
			setScrollPos({ isStart: false, isEnd: false });
		} else {
			setScrollPos({ isStart: true, isEnd: false });
		}
	}, [content]);

	const debouncedScroll = useCallback(
		() => debounce(handleScroll, 50),
		[handleScroll],
	);
	useEffect(() => {
		const handleResize = () => {
			debouncedScroll();
		};
		window.addEventListener("resize", handleResize, { passive: true });
		return () => window.removeEventListener("resize", handleResize);
	}, [debouncedScroll]);

	useEffect(() => {
		handleScroll();
	}, [handleScroll, content]);

	const onScroll = () => {
		debouncedScroll();
	};

	const [, setX] = useSpring(() => ({
		from: { x: 0 },
		to: { x: 0 },
		onChange: (results) => {
			if (containerRef.current) {
				containerRef.current.scrollLeft = results.value.x;
			}
		},
	}));

	const slide = (direction: Direction) => {
		const clientWidth =
			containerRef.current?.getBoundingClientRect().width ?? 0;
		const cardWidth =
			containerRef.current?.firstElementChild?.getBoundingClientRect().width ??
			0;
		const scrollPosition = containerRef.current?.scrollLeft ?? 0;
		const visibleItems = Math.floor(clientWidth / cardWidth);
		const scrollOffset = scrollPosition % cardWidth;

		if (direction === Direction.LEFT) {
			const newX = Math.max(
				scrollPosition - scrollOffset - visibleItems * cardWidth,
				0,
			);
			setX.start({
				from: { x: scrollPosition },
				to: { x: newX },
				onChange: (results) => {
					if (containerRef.current) {
						containerRef.current.scrollLeft = results.value.x;
					}
				},
				reset: true,
				config: { friction: 60, tension: 1000, velocity: 2 },
			});

			if (newX === 0) {
				setScrollPos({ isStart: true, isEnd: false });
			} else {
				setScrollPos({ isStart: false, isEnd: false });
			}
		} else if (direction === Direction.RIGHT) {
			const newX = Math.min(
				scrollPosition - scrollOffset + visibleItems * cardWidth,
				containerRef.current?.scrollWidth ?? 0 - clientWidth,
			);
			setX.start({
				from: { x: scrollPosition },
				to: { x: newX },
				onChange: (results) => {
					if (containerRef.current) {
						containerRef.current.scrollLeft = results.value.x;
					}
				},
				reset: true,
				config: { friction: 60, tension: 500, velocity: 2 },
			});

			if (newX >= (containerRef.current?.scrollWidth ?? 0) - clientWidth) {
				setScrollPos({ isStart: false, isEnd: true });
			} else {
				setScrollPos({ isStart: false, isEnd: false });
			}
		}
	};

	return (
		<div className="slider">
			<IconButton
				className="slider-button left"
				onClick={() => slide(Direction.LEFT)}
				disabled={scrollPos.isStart}
				variant="contained"
			>
				<span className="material-symbols-rounded">chevron_left</span>
			</IconButton>
			<div className="slider-track" ref={containerRef} onScroll={onScroll}>
				{content?.map((item, index) => (
					<div
						key={index}
						className={
							currentSlide === index
								? "slider-track-item active"
								: "slider-track-item"
						}
					>
						{item}
					</div>
				))}
			</div>
			<IconButton
				className="slider-button right"
				onClick={() => slide(Direction.RIGHT)}
				disabled={scrollPos.isEnd}
				variant="contained"
			>
				<span className="material-symbols-rounded">chevron_right</span>
			</IconButton>
		</div>
	);
};
export default Slider;