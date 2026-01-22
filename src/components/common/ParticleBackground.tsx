import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

// 性能优化：使用空间分区网格加速粒子连线查找
class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, number[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  getCellKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  insert(index: number, x: number, y: number) {
    const key = this.getCellKey(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(index);
  }

  getNearby(x: number, y: number): number[] {
    const result: number[] = [];
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);

    // 检查周围9个格子
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const cell = this.grid.get(key);
        if (cell) {
          result.push(...cell);
        }
      }
    }
    return result;
  }
}

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();
  const gridRef = useRef<SpatialGrid>(new SpatialGrid(120));
  const [isVisible, setIsVisible] = useState(true);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    // 颜色数组 - 科技感蓝紫色系
    const colors = [
      'rgba(99, 102, 241, 0.6)',
      'rgba(6, 182, 212, 0.6)',
      'rgba(139, 92, 246, 0.5)',
    ];

    // 初始化粒子 - 减少数量
    const initParticles = () => {
      const maxParticles = 40; // 固定最大粒子数
      const particleCount = Math.min(maxParticles, Math.floor((window.innerWidth * window.innerHeight) / 25000));

      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.2,
      }));
    };

    resizeCanvas();

    // 防抖处理resize
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 200);
    };
    window.addEventListener('resize', handleResize);

    // 节流鼠标移动
    let lastMouseUpdate = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseUpdate > 50) {
        mouseRef.current = { x: e.clientX, y: e.clientY };
        lastMouseUpdate = now;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 页面可见性变化处理
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 动画循环 - 优化版
    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      frameCountRef.current++;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // 更新空间分区网格
      const grid = gridRef.current;
      grid.clear();

      const particles = particlesRef.current;

      // 更新粒子位置并插入网格
      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 边界检测
        if (particle.x < 0) { particle.x = 0; particle.vx *= -1; }
        if (particle.x > w) { particle.x = w; particle.vx *= -1; }
        if (particle.y < 0) { particle.y = 0; particle.vy *= -1; }
        if (particle.y > h) { particle.y = h; particle.vy *= -1; }

        // 鼠标交互 - 简化计算
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 40000) { // 200^2
          const dist = Math.sqrt(distSq);
          const force = (200 - dist) / 200 * 0.015;
          particle.vx += (dx / dist) * force;
          particle.vy += (dy / dist) * force;
        }

        // 速度限制
        const speedSq = particle.vx * particle.vx + particle.vy * particle.vy;
        if (speedSq > 4) {
          const speed = Math.sqrt(speedSq);
          particle.vx = (particle.vx / speed) * 2;
          particle.vy = (particle.vy / speed) * 2;
        }

        grid.insert(i, particle.x, particle.y);
      });

      // 批量绘制粒子
      ctx.beginPath();
      particles.forEach((particle) => {
        ctx.moveTo(particle.x + particle.radius, particle.y);
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      });
      ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
      ctx.fill();

      // 使用空间分区优化连线绘制
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 0.5;

      const drawnPairs = new Set<string>();

      particles.forEach((particle, i) => {
        const nearby = grid.getNearby(particle.x, particle.y);

        for (const j of nearby) {
          if (j <= i) continue;

          const pairKey = `${i}-${j}`;
          if (drawnPairs.has(pairKey)) continue;
          drawnPairs.add(pairKey);

          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 14400) { // 120^2
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
          }
        }
      });
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    // 延迟启动动画，让主要内容先加载
    const startTimeout = setTimeout(() => {
      animate();
    }, 100);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent', willChange: 'transform' }}
    />
  );
};

export default ParticleBackground;
