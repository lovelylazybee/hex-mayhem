import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HexButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'gold' | 'cyan';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function HexButton({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled = false,
  type = 'button',
}: HexButtonProps) {
  const variantStyles: Record<string, string> = {
    primary:
      'bg-gradient-to-r from-hex-purple to-hex-blue hover:from-hex-purple/90 hover:to-hex-blue/90 shadow-[0_0_15px_rgba(124,77,255,0.4)] hover:shadow-[0_0_25px_rgba(124,77,255,0.6)]',
    gold:
      'bg-gradient-to-r from-hex-gold to-yellow-600 hover:from-hex-gold/90 hover:to-yellow-600/90 shadow-[0_0_15px_rgba(255,215,0,0.4)] hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] text-hex-dark',
    cyan:
      'bg-gradient-to-r from-hex-cyan to-blue-500 hover:from-hex-cyan/90 hover:to-blue-500/90 shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:shadow-[0_0_25px_rgba(0,229,255,0.6)] text-hex-dark',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-6 py-2.5 rounded-lg font-bold font-noto-sans transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </motion.button>
  );
}
