import { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  reverse?: boolean;
}

export default function ParallaxSection({
  children,
  speed = 0.1,
  className = '',
  reverse = false
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  // Direction of parallax effect
  const direction = reverse ? -1 : 1;
  
  // Create a transform value based on scroll progress
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [0, direction * speed * 100 + '%']
  );

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div 
        style={{ y }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
} 