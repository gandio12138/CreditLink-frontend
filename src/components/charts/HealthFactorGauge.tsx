import { useMemo } from 'react';

interface HealthFactorGaugeProps {
  healthFactor: number;  // 健康因子值
  liquidationThreshold?: number;  // 清算阈值，默认1.0
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export default function HealthFactorGauge({
  healthFactor,
  liquidationThreshold = 1.0,
  size = 'md',
  showLabels = true,
}: HealthFactorGaugeProps) {
  // 尺寸配置
  const sizeConfig = {
    sm: { width: 120, strokeWidth: 8, fontSize: 'text-lg', labelSize: 'text-[8px]' },
    md: { width: 160, strokeWidth: 10, fontSize: 'text-2xl', labelSize: 'text-[10px]' },
    lg: { width: 200, strokeWidth: 12, fontSize: 'text-3xl', labelSize: 'text-xs' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 计算健康因子显示值（最大显示到3.0）
  const displayValue = Math.min(healthFactor, 3);
  const maxValue = 3;

  // 计算仪表盘角度（半圆，从左到右）
  const startAngle = 180;
  const angleRange = 180;
  // endAngle = 0 (unused but kept for documentation)

  // 计算当前值对应的角度
  const valueAngle = Math.min((displayValue / maxValue) * angleRange, angleRange);

  // 计算弧长
  const halfCircumference = circumference / 2;
  const filledLength = (valueAngle / 180) * halfCircumference;

  // 根据健康因子确定颜色和状态
  const { color, bgColor, status, statusColor } = useMemo(() => {
    if (healthFactor < liquidationThreshold) {
      return {
        color: '#ef4444',
        bgColor: 'from-rose-500/20 to-rose-900/10',
        status: '清算风险',
        statusColor: 'text-rose-400',
      };
    } else if (healthFactor < 1.25) {
      return {
        color: '#f97316',
        bgColor: 'from-orange-500/20 to-orange-900/10',
        status: '高风险',
        statusColor: 'text-orange-400',
      };
    } else if (healthFactor < 1.5) {
      return {
        color: '#eab308',
        bgColor: 'from-yellow-500/20 to-yellow-900/10',
        status: '中等风险',
        statusColor: 'text-yellow-400',
      };
    } else if (healthFactor < 2) {
      return {
        color: '#22c55e',
        bgColor: 'from-emerald-500/20 to-emerald-900/10',
        status: '安全',
        statusColor: 'text-emerald-400',
      };
    } else {
      return {
        color: '#06b6d4',
        bgColor: 'from-cyan-500/20 to-cyan-900/10',
        status: '非常安全',
        statusColor: 'text-cyan-400',
      };
    }
  }, [healthFactor, liquidationThreshold]);

  // 计算指针位置
  const pointerAngle = startAngle - valueAngle;
  const pointerRad = (pointerAngle * Math.PI) / 180;
  const pointerLength = radius - config.strokeWidth;
  const pointerX = config.width / 2 + pointerLength * Math.cos(pointerRad);
  const pointerY = config.width / 2 + pointerLength * Math.sin(pointerRad);

  // 刻度标记位置
  const ticks = [0, 1, 1.5, 2, 3];
  const tickPositions = ticks.map(tick => {
    const tickAngle = startAngle - (tick / maxValue) * angleRange;
    const tickRad = (tickAngle * Math.PI) / 180;
    const innerRadius = radius - config.strokeWidth / 2 - 8;
    const outerRadius = radius - config.strokeWidth / 2 - 2;
    return {
      value: tick,
      x1: config.width / 2 + innerRadius * Math.cos(tickRad),
      y1: config.width / 2 + innerRadius * Math.sin(tickRad),
      x2: config.width / 2 + outerRadius * Math.cos(tickRad),
      y2: config.width / 2 + outerRadius * Math.sin(tickRad),
      labelX: config.width / 2 + (innerRadius - 10) * Math.cos(tickRad),
      labelY: config.width / 2 + (innerRadius - 10) * Math.sin(tickRad),
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width / 2 + 20 }}>
        <svg
          width={config.width}
          height={config.width / 2 + 20}
          viewBox={`0 0 ${config.width} ${config.width / 2 + 20}`}
        >
          {/* 定义渐变和滤镜 */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="33%" stopColor="#eab308" />
              <stop offset="66%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="pointerGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* 背景弧 */}
          <path
            d={`M ${config.strokeWidth / 2} ${config.width / 2}
                A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.width / 2}`}
            fill="none"
            stroke="#1f2937"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />

          {/* 渐变背景弧 */}
          <path
            d={`M ${config.strokeWidth / 2} ${config.width / 2}
                A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.width / 2}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeOpacity="0.2"
          />

          {/* 当前值弧 */}
          <path
            d={`M ${config.strokeWidth / 2} ${config.width / 2}
                A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.width / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${filledLength} ${halfCircumference}`}
            filter="url(#gaugeGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* 清算阈值标记 */}
          {healthFactor > 0 && (
            <line
              x1={config.width / 2 + (radius - config.strokeWidth) * Math.cos(Math.PI - (liquidationThreshold / maxValue) * Math.PI)}
              y1={config.width / 2 - (radius - config.strokeWidth) * Math.sin(Math.PI - (liquidationThreshold / maxValue) * Math.PI)}
              x2={config.width / 2 + (radius + config.strokeWidth) * Math.cos(Math.PI - (liquidationThreshold / maxValue) * Math.PI)}
              y2={config.width / 2 - (radius + config.strokeWidth) * Math.sin(Math.PI - (liquidationThreshold / maxValue) * Math.PI)}
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* 刻度线和标签 */}
          {showLabels && tickPositions.map((tick, index) => (
            <g key={index}>
              <line
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="#4b5563"
                strokeWidth="1"
              />
              <text
                x={tick.labelX}
                y={tick.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`fill-gray-500 ${config.labelSize}`}
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* 指针 */}
          <line
            x1={config.width / 2}
            y1={config.width / 2}
            x2={pointerX}
            y2={pointerY}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#pointerGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* 中心圆点 */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r="6"
            fill={color}
            stroke="#1f2937"
            strokeWidth="2"
          />
        </svg>

        {/* 中心数值显示 */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: '0' }}
        >
          <div className={`${config.fontSize} font-bold text-center`} style={{ color }}>
            {healthFactor >= 10 ? '10+' : healthFactor.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 状态标签 */}
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${statusColor} bg-gradient-to-r ${bgColor} border border-current/20`}>
        {status}
      </div>

      {/* 说明文字 */}
      {showLabels && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            健康因子 &lt; {liquidationThreshold} 时可能被清算
          </p>
        </div>
      )}
    </div>
  );
}
