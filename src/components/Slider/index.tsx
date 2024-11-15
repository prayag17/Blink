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
import { IconButton } from "@mui/material";

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

	const slideLeft = useCallback(() => {
		const clientWidth =
			containerRef.current?.getBoundingClientRect().width ?? 0;
		const cardWidth =
			containerRef.current?.firstElementChild?.getBoundingClientRect().width ??
			0;
		const scrollPosition = containerRef.current?.scrollLeft ?? 0;
		const visibleItems = Math.floor(clientWidth / cardWidth);
		const scrollOffset = scrollPosition % cardWidth;

		const newX = Math.max(
			scrollPosition - scrollOffset - visibleItems * cardWidth,
			0,
		);
		setX({
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
	}, [setX]);

	const slideRight = useCallback(() => {
		const clientWidth =
			containerRef.current?.getBoundingClientRect().width ?? 0;
		const cardWidth =
			containerRef.current?.firstElementChild?.getBoundingClientRect().width ??
			0;
		const scrollPosition = containerRef.current?.scrollLeft ?? 0;
		const visibleItems = Math.floor(clientWidth / cardWidth);
		const scrollOffset = scrollPosition % cardWidth;

		const newX = Math.min(
			scrollPosition - scrollOffset + visibleItems * cardWidth,
			containerRef.current?.scrollWidth ?? 0 - clientWidth,
		);
		setX({
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
	}, [setX]);

	return (
		<div className="slider">
			<IconButton
				className="slider-button left"
				onClick={slideLeft}
				disabled={scrollPos.isStart}
			>
				<span className="material-symbols-rounded">chevron_left</span>
			</IconButton>
			<div className="slider-track" ref={containerRef} onScroll={onScroll}>
				{content?.map((item, index) => (
					<div
						//biome-ignore lint/suspicious/noArrayIndexKey: item does not have a unique key
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
				onClick={slideRight}
				disabled={scrollPos.isEnd}
			>
				<span className="material-symbols-rounded">chevron_right</span>
			</IconButton>
		</div>
	);
};
export default Slider;