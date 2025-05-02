import { MotionValue, useTransform } from 'framer-motion';

/**
 * Creates a parallax effect for vertical scrolling
 * @param scrollYProgress - A motion value tracking vertical scroll progress
 * @param distance - The distance in pixels the element should move
 * @returns A motion value that can be passed to style.y
 */
export function useParallaxY(scrollYProgress: MotionValue<number>, distance: number) {
  return useTransform(scrollYProgress, [0, 1], [0, distance]);
}

/**
 * Creates a parallax effect for horizontal scrolling
 * @param scrollXProgress - A motion value tracking horizontal scroll progress
 * @param distance - The distance in pixels the element should move
 * @returns A motion value that can be passed to style.x
 */
export function useParallaxX(scrollXProgress: MotionValue<number>, distance: number) {
  return useTransform(scrollXProgress, [0, 1], [0, distance]);
}

/**
 * Creates a opacity effect that changes with scroll
 * @param scrollProgress - A motion value tracking scroll progress
 * @param inputRange - Array of scroll progress values between 0 and 1
 * @param outputRange - Array of opacity values corresponding to the input range
 * @returns A motion value that can be passed to style.opacity
 */
export function useParallaxOpacity(
  scrollProgress: MotionValue<number>,
  inputRange: [number, number] = [0, 1],
  outputRange: [number, number] = [0, 1]
) {
  return useTransform(scrollProgress, inputRange, outputRange);
}

/**
 * Creates a rotation effect that changes with scroll
 * @param scrollProgress - A motion value tracking scroll progress
 * @param range - Maximum rotation in degrees
 * @returns A motion value that can be passed to style.rotate
 */
export function useParallaxRotate(scrollProgress: MotionValue<number>, range: number) {
  return useTransform(scrollProgress, [0, 1], [0, range]);
}

/**
 * Creates a scale effect that changes with scroll
 * @param scrollProgress - A motion value tracking scroll progress
 * @param inputRange - Array of scroll progress values between 0 and 1
 * @param outputRange - Array of scale values corresponding to the input range
 * @returns A motion value that can be passed to style.scale
 */
export function useParallaxScale(
  scrollProgress: MotionValue<number>,
  inputRange: [number, number] = [0, 1],
  outputRange: [number, number] = [1, 1.2]
) {
  return useTransform(scrollProgress, inputRange, outputRange);
} 