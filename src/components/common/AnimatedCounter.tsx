import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;  // 动画持续时间（毫秒）
  prefix?: string;    // 前缀，如 $
  suffix?: string;    // 后缀，如 %
  decimals?: number;  // 小数位数
  formatLarge?: boolean;  // 是否格式化大数字 (K, M, B)
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatLarge = false,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);

  // 格式化大数字
  const formatNumber = (num: number): string => {
    if (!formatLarge) {
      return num.toFixed(decimals);
    }

    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(2)}K`;
    }
    return num.toFixed(decimals);
  };

  useEffect(() => {
    // 如果值没有变化，不执行动画
    if (value === previousValue.current) return;

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用 easeOutExpo 缓动函数
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = startValue + (endValue - startValue) * easeOutExpo;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        previousValue.current = endValue;
      }
    };

    // 取消之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <span className={`${className} ${isAnimating ? 'tabular-nums' : ''}`}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}

// 带动画的统计数字组件
interface AnimatedStatProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  formatLarge?: boolean;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
}

export function AnimatedStat({
  label,
  value,
  prefix = '',
  suffix = '',
  formatLarge = true,
  icon,
  trend,
  gradient = 'from-primary-500 to-cyan-500',
}: AnimatedStatProps) {
  return (
    <div className="relative p-4 rounded-xl bg-dark-100/50 border border-gray-700/50 hover:border-primary-500/30 transition-all group overflow-hidden">
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="text-sm text-gray-400">{label}</span>
        </div>

        <div className="flex items-end gap-2">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            formatLarge={formatLarge}
            className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
            duration={1200}
          />

          {trend && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              <svg
                className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
