import { useState, useMemo } from 'react';

interface InterestRateCurveProps {
  baseRate?: number;      // 基础利率 (%)
  optimalUtilization?: number;  // 最优利用率 (%)
  slope1?: number;        // 斜率1 (%)
  slope2?: number;        // 斜率2 (%)
  currentUtilization?: number;  // 当前利用率 (%)
  creditDiscount?: number; // 信用折扣 (%)
}

export default function InterestRateCurve({
  baseRate = 2,
  optimalUtilization = 80,
  slope1 = 4,
  slope2 = 75,
  currentUtilization = 0,
  creditDiscount = 0,
}: InterestRateCurveProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; util: number; rate: number } | null>(null);
  const [isAnimated, setIsAnimated] = useState(true);

  // 计算利率
  const calculateRate = (utilization: number): number => {
    if (utilization <= optimalUtilization) {
      return baseRate + (slope1 * utilization) / optimalUtilization;
    } else {
      const baseAtOptimal = baseRate + slope1;
      const excessUtilization = utilization - optimalUtilization;
      const excessRange = 100 - optimalUtilization;
      return baseAtOptimal + (slope2 * excessUtilization) / excessRange;
    }
  };

  // 生成曲线路径
  const { pathData, pathDataDiscounted, maxRate, points, discountedPoints } = useMemo(() => {
    const pts: { x: number; y: number; util: number; rate: number }[] = [];
    const discPts: { x: number; y: number; util: number; rate: number }[] = [];

    for (let i = 0; i <= 100; i += 2) {
      const rate = calculateRate(i);
      const discountedRate = rate * (1 - creditDiscount / 100);
      pts.push({ x: i, y: rate, util: i, rate });
      discPts.push({ x: i, y: discountedRate, util: i, rate: discountedRate });
    }

    const max = Math.max(...pts.map(p => p.y)) * 1.1;

    // 转换为SVG坐标
    const width = 400;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const toSvgX = (x: number) => padding.left + (x / 100) * chartWidth;
    const toSvgY = (y: number) => padding.top + chartHeight - (y / max) * chartHeight;

    const svgPts = pts.map(p => ({ ...p, svgX: toSvgX(p.x), svgY: toSvgY(p.y) }));
    const svgDiscPts = discPts.map(p => ({ ...p, svgX: toSvgX(p.x), svgY: toSvgY(p.y) }));

    const path = `M ${svgPts[0].svgX} ${svgPts[0].svgY} ` +
      svgPts.slice(1).map(p => `L ${p.svgX} ${p.svgY}`).join(' ');

    const discPath = creditDiscount > 0
      ? `M ${svgDiscPts[0].svgX} ${svgDiscPts[0].svgY} ` +
        svgDiscPts.slice(1).map(p => `L ${p.svgX} ${p.svgY}`).join(' ')
      : '';

    return {
      pathData: path,
      pathDataDiscounted: discPath,
      maxRate: max,
      points: svgPts,
      discountedPoints: svgDiscPts
    };
  }, [baseRate, optimalUtilization, slope1, slope2, creditDiscount]);

  // SVG 尺寸
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const toSvgX = (x: number) => padding.left + (x / 100) * chartWidth;
  const toSvgY = (y: number) => padding.top + chartHeight - (y / maxRate) * chartHeight;

  // 当前点
  const currentRate = calculateRate(currentUtilization);
  const currentDiscountedRate = currentRate * (1 - creditDiscount / 100);
  const currentX = toSvgX(currentUtilization);
  const currentY = toSvgY(currentRate);
  const currentDiscountedY = toSvgY(currentDiscountedRate);

  // 最优利用率线
  const optimalX = toSvgX(optimalUtilization);

  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = (x - padding.left) / chartWidth;

    if (relativeX >= 0 && relativeX <= 1) {
      const util = Math.round(relativeX * 100);
      const rate = calculateRate(util);
      setHoveredPoint({
        x: toSvgX(util),
        y: toSvgY(rate),
        util,
        rate
      });
    }
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        {/* 定义渐变 */}
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset={`${optimalUtilization}%`} stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="discountGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 网格线 */}
        <g className="text-gray-700">
          {[0, 25, 50, 75, 100].map((tick) => (
            <line
              key={`grid-x-${tick}`}
              x1={toSvgX(tick)}
              y1={padding.top}
              x2={toSvgX(tick)}
              y2={height - padding.bottom}
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeDasharray="4,4"
            />
          ))}
          {[0, maxRate * 0.25, maxRate * 0.5, maxRate * 0.75, maxRate].map((tick, i) => (
            <line
              key={`grid-y-${i}`}
              x1={padding.left}
              y1={toSvgY(tick)}
              x2={width - padding.right}
              y2={toSvgY(tick)}
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeDasharray="4,4"
            />
          ))}
        </g>

        {/* 最优利用率线 */}
        <line
          x1={optimalX}
          y1={padding.top}
          x2={optimalX}
          y2={height - padding.bottom}
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeDasharray="6,4"
          strokeOpacity="0.6"
        />
        <text
          x={optimalX}
          y={padding.top - 5}
          textAnchor="middle"
          className="fill-violet-400 text-[10px] font-medium"
        >
          最优 {optimalUtilization}%
        </text>

        {/* 面积填充 */}
        <path
          d={`${pathData} L ${toSvgX(100)} ${height - padding.bottom} L ${toSvgX(0)} ${height - padding.bottom} Z`}
          fill="url(#areaGradient)"
          className={isAnimated ? 'animate-fade-in' : ''}
        />

        {/* 主曲线 */}
        <path
          d={pathData}
          fill="none"
          stroke="url(#curveGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          className={isAnimated ? 'animate-draw-line' : ''}
          style={{
            strokeDasharray: isAnimated ? '1000' : 'none',
            strokeDashoffset: isAnimated ? '0' : 'none',
          }}
        />

        {/* 折扣曲线 */}
        {creditDiscount > 0 && (
          <path
            d={pathDataDiscounted}
            fill="none"
            stroke="url(#discountGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6,4"
            opacity="0.8"
          />
        )}

        {/* 当前利用率点 */}
        {currentUtilization > 0 && (
          <g>
            {/* 垂直参考线 */}
            <line
              x1={currentX}
              y1={currentY}
              x2={currentX}
              y2={height - padding.bottom}
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="4,4"
              strokeOpacity="0.5"
            />
            {/* 当前点 */}
            <circle
              cx={currentX}
              cy={currentY}
              r="6"
              fill="#06b6d4"
              stroke="#fff"
              strokeWidth="2"
              filter="url(#glow)"
              className="animate-pulse"
            />
            {/* 折扣后的点 */}
            {creditDiscount > 0 && (
              <circle
                cx={currentX}
                cy={currentDiscountedY}
                r="5"
                fill="#10b981"
                stroke="#fff"
                strokeWidth="2"
              />
            )}
          </g>
        )}

        {/* 悬浮点 */}
        {hoveredPoint && (
          <g>
            <line
              x1={hoveredPoint.x}
              y1={hoveredPoint.y}
              x2={hoveredPoint.x}
              y2={height - padding.bottom}
              stroke="#fff"
              strokeWidth="1"
              strokeDasharray="2,2"
              strokeOpacity="0.3"
            />
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="5"
              fill="#fff"
              stroke="#8b5cf6"
              strokeWidth="2"
            />
          </g>
        )}

        {/* X轴标签 */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <text
            key={`label-x-${tick}`}
            x={toSvgX(tick)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            className="fill-gray-500 text-[10px]"
          >
            {tick}%
          </text>
        ))}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="fill-gray-400 text-[11px] font-medium"
        >
          资金利用率
        </text>

        {/* Y轴标签 */}
        {[0, maxRate * 0.5, maxRate].map((tick, i) => (
          <text
            key={`label-y-${i}`}
            x={padding.left - 10}
            y={toSvgY(tick) + 4}
            textAnchor="end"
            className="fill-gray-500 text-[10px]"
          >
            {tick.toFixed(0)}%
          </text>
        ))}
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
          className="fill-gray-400 text-[11px] font-medium"
        >
          借款利率
        </text>
      </svg>

      {/* 悬浮提示框 */}
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-dark-300/95 border border-primary-500/30 backdrop-blur-sm shadow-lg"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-xs text-gray-400">利用率: <span className="text-white font-medium">{hoveredPoint.util}%</span></div>
          <div className="text-xs text-gray-400">借款利率: <span className="text-amber-400 font-medium">{hoveredPoint.rate.toFixed(2)}%</span></div>
          {creditDiscount > 0 && (
            <div className="text-xs text-gray-400">
              折扣后: <span className="text-emerald-400 font-medium">{(hoveredPoint.rate * (1 - creditDiscount / 100)).toFixed(2)}%</span>
            </div>
          )}
        </div>
      )}

      {/* 图例 */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-rose-500 rounded-full" />
          <span className="text-gray-400">借款利率曲线</span>
        </div>
        {creditDiscount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ borderStyle: 'dashed' }} />
            <span className="text-gray-400">信用折扣后 (-{creditDiscount}%)</span>
          </div>
        )}
        {currentUtilization > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-gray-400">当前: {currentUtilization}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
