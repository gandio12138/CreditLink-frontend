/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色调 - 科技蓝紫渐变
        primary: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // 强调色 - 青色
        accent: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        // 霓虹色系
        neon: {
          pink: '#ff0080',
          purple: '#7928ca',
          blue: '#0070f3',
          cyan: '#00d4ff',
          green: '#00ff88',
          yellow: '#ffdd00',
          orange: '#ff6600',
          red: '#ff0044',
        },
        // 深色背景
        dark: {
          50: '#1e293b',
          100: '#1a2234',
          200: '#151c2c',
          300: '#111827',
          400: '#0d1320',
          500: '#0a0f1a',
          600: '#060912',
          700: '#030508',
          800: '#010203',
          900: '#000000',
        },
        // 玻璃效果色
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
          primary: 'rgba(99, 102, 241, 0.15)',
          accent: 'rgba(6, 182, 212, 0.15)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-pattern': 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
        'card-gradient': 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
        'glow-gradient': 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
        'neon-gradient': 'linear-gradient(90deg, #ff0080, #7928ca, #0070f3, #00d4ff, #00ff88)',
        'aurora-gradient': 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #1a1a2e)',
        'cyber-grid': 'linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(253, 82%, 58%, 0.5) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(253, 82%, 58%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(253, 82%, 58%, 0.2) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(189, 100%, 56%, 0.3) 0px, transparent 50%)',
      },
      animation: {
        // 基础动画
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',

        // 发光动画
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',

        // 渐变动画
        'shimmer': 'shimmer 2s linear infinite',
        'gradient': 'gradient 8s linear infinite',
        'gradient-x': 'gradientX 3s ease infinite',
        'gradient-xy': 'gradientXY 15s ease infinite',

        // 旋转动画
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse': 'spinReverse 4s linear infinite',
        'rotate-border': 'rotateBorder 4s linear infinite',

        // 缩放动画
        'scale-pulse': 'scalePulse 2s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',

        // 滑动动画
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',

        // 淡入动画
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',

        // 特效动画
        'aurora': 'aurora 20s linear infinite',
        'wave': 'wave 10s ease-in-out infinite',
        'ripple': 'ripple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'text-shimmer': 'textShimmer 2.5s ease infinite',
        'border-flow': 'borderFlow 3s ease-in-out infinite',
        'neon-flicker': 'neonFlicker 1.5s infinite alternate',

        // 粒子动画
        'particle-1': 'particleFloat 12s ease-in-out infinite',
        'particle-2': 'particleFloat 15s ease-in-out infinite reverse',
        'particle-3': 'particleFloat 18s ease-in-out infinite',

        // 3D 动画
        'tilt': 'tilt 10s ease-in-out infinite',
        'flip': 'flip 6s ease-in-out infinite',
      },
      keyframes: {
        // 漂浮
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },

        // 发光
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(6, 182, 212, 0.2)'
          },
          '50%': {
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.6), 0 0 80px rgba(6, 182, 212, 0.4)'
          },
        },

        // 闪烁
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },

        // 渐变移动
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        gradientX: {
          '0%, 100%': { backgroundSize: '200% 200%', backgroundPosition: 'left center' },
          '50%': { backgroundSize: '200% 200%', backgroundPosition: 'right center' },
        },
        gradientXY: {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
        },

        // 反向旋转
        spinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        rotateBorder: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },

        // 缩放脉冲
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },

        // 滑动
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },

        // 淡入
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        // 极光
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },

        // 波浪
        wave: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },

        // 涟漪
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },

        // 变形
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },

        // 文字闪烁
        textShimmer: {
          '0%': { backgroundPosition: '-500%' },
          '100%': { backgroundPosition: '500%' },
        },

        // 边框流动
        borderFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },

        // 霓虹闪烁
        neonFlicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            textShadow: '0 0 4px #fff, 0 0 11px #fff, 0 0 19px #fff, 0 0 40px #0fa, 0 0 80px #0fa, 0 0 90px #0fa, 0 0 100px #0fa, 0 0 150px #0fa',
          },
          '20%, 24%, 55%': {
            textShadow: 'none',
          },
        },

        // 粒子浮动
        particleFloat: {
          '0%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: '0.5' },
          '25%': { transform: 'translateY(-50px) translateX(25px) scale(1.1)', opacity: '0.8' },
          '50%': { transform: 'translateY(-100px) translateX(-25px) scale(1)', opacity: '0.5' },
          '75%': { transform: 'translateY(-50px) translateX(-50px) scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: '0.5' },
        },

        // 3D 倾斜
        tilt: {
          '0%, 100%': { transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' },
          '25%': { transform: 'perspective(1000px) rotateX(5deg) rotateY(-5deg)' },
          '50%': { transform: 'perspective(1000px) rotateX(-5deg) rotateY(5deg)' },
          '75%': { transform: 'perspective(1000px) rotateX(5deg) rotateY(5deg)' },
        },

        // 翻转
        flip: {
          '0%': { transform: 'perspective(400px) rotateY(0)' },
          '100%': { transform: 'perspective(400px) rotateY(360deg)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
        'glow-xl': '0 0 60px rgba(99, 102, 241, 0.5)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-cyan-lg': '0 0 40px rgba(6, 182, 212, 0.4)',
        'glow-pink': '0 0 20px rgba(255, 0, 128, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(99, 102, 241, 0.1)',
        'inner-glow-lg': 'inset 0 0 40px rgba(99, 102, 241, 0.2)',
        'neon': '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #6366f1, 0 0 30px #6366f1, 0 0 40px #6366f1',
        'neon-cyan': '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #06b6d4, 0 0 30px #06b6d4, 0 0 40px #06b6d4',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'card-hover': '0 20px 50px -10px rgba(99, 102, 241, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
        '1500': '1500ms',
        '2000': '2000ms',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
        '104': '1.04',
      },
      blur: {
        '4xl': '72px',
        '5xl': '96px',
      },
    },
  },
  plugins: [],
}
