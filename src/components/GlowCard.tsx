import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export default function GlowCard({ children, className, glowColor = 'purple' }: GlowCardProps) {
  const glowMap: Record<string, string> = {
    purple: 'hover:shadow-[0_0_30px_rgba(124,77,255,0.4)]',
    gold: 'hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]',
    cyan: 'hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]',
  };

  const borderMap: Record<string, string> = {
    purple: 'border-hex-purple/30 hover:border-hex-purple/60',
    gold: 'border-hex-gold/30 hover:border-hex-gold/60',
    cyan: 'border-hex-cyan/30 hover:border-hex-cyan/60',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-hex-card/80 backdrop-blur-sm border rounded-xl p-6 transition-all duration-300',
        borderMap[glowColor] || borderMap.purple,
        glowMap[glowColor] || glowMap.purple,
        className
      )}
    >
      {children}
    </motion.div>
  );
}
