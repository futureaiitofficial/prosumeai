import { ReactNode, useRef } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';

interface FloatingElementProps {
  y?: number;
  x?: number;
  duration?: number;
  delay?: number;
  className?: string;
  children: ReactNode;
}

export default function FloatingElement({
  y = 10,
  x = 0,
  duration = 4,
  delay = 0,
  className = '',
  children
}: FloatingElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const animationTime = useRef(0);

  useAnimationFrame((time) => {
    if (!ref.current) return;
    
    const adjustedTime = time * 0.001 + delay; // Convert to seconds and add delay
    
    // Calculate a floating motion using sin wave
    const yPosition = Math.sin(adjustedTime / duration) * y;
    const xPosition = Math.sin(adjustedTime / (duration * 1.5)) * x;
    
    ref.current.style.transform = `translate(${xPosition}px, ${yPosition}px)`;
    
    animationTime.current = time;
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
} 