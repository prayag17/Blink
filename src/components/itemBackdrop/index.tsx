import {
	AnimatePresence,
	type HTMLMotionProps,
	motion,
	useScroll,
	useTransform,
} from "motion/react";
import React, { type RefObject, useEffect, useState } from "react";

interface ItemBackdropProps {
	targetRef: RefObject<HTMLElement | null>;
	backdropSrc?: string;
	fallbackSrc: string;
	alt: string;
	distance?: number; // parallax distance
	className?: string;
	onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
	motionProps?: HTMLMotionProps<"img">;
}

const MotionImg = motion.img;

const animationProps = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
	transition: { duration: 0.5 },
};

/**
 * ItemBackdrop delays applying motion-driven parallax until after mount
 * to avoid hydration timing errors ("Target ref is defined but not hydrated").
 * It accepts a scroll container ref from the parent; if the ref is not yet
 * attached, it renders a static img to prevent motion from touching an
 * unhydrated DOM node.
 */
const ItemBackdropContent = React.memo(function ItemBackdropContent({
	targetRef,
	src,
	alt,
	distance,
	className,
	onLoad,
	motionProps,
}: {
	targetRef: RefObject<HTMLElement | null>;
	src: string;
	alt: string;
	distance: number;
	className?: string;
	onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
	motionProps?: HTMLMotionProps<"img">;
}) {
	const { scrollYProgress } = useScroll({
		target: targetRef,
		offset: ["start start", "60vh start"],
	});
	const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);
	return (
		<MotionImg
			alt={alt}
			src={src}
			className={className ?? "item-hero-backdrop"}
			onLoad={(e) => {
				onLoad?.(e);
			}}
			style={{ y }}
			{...motionProps}
		/>
	);
});

export function ItemBackdrop({
	targetRef,
	backdropSrc,
	fallbackSrc,
	alt,
	distance = 50,
	className,
	onLoad,
	motionProps,
}: ItemBackdropProps) {
	const src = backdropSrc || fallbackSrc;
	const [ready, setReady] = useState(false);
	// Poll a few animation frames until the target ref hydrates to avoid premature motion initialization.
	useEffect(() => {
		if (ready) return;
		let frame = 0;
		let raf: number;
		const tick = () => {
			if (targetRef.current || frame > 5) {
				setReady(true);
				return;
			}
			frame++;
			raf = requestAnimationFrame(tick);
		};
		tick();
		return () => cancelAnimationFrame(raf);
	}, [targetRef, ready]);

	const finalMotionProps = React.useMemo(
		() => ({
			...animationProps,
			...motionProps,
		}),
		[motionProps],
	);

	if (!ready) {
		return (
			<img
				alt={alt}
				src={src}
				className={className ?? "item-hero-backdrop"}
				onLoad={(e) => {
					e.currentTarget.style.opacity = "1";
					onLoad?.(e);
				}}
			/>
		);
	}

	return (
		<AnimatePresence>
			<ItemBackdropContent
				key={src}
				targetRef={targetRef}
				src={src}
				alt={alt}
				distance={distance}
				className={className}
				onLoad={onLoad}
				motionProps={finalMotionProps}
			/>
		</AnimatePresence>
	);
}

export default ItemBackdrop;
