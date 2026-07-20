/** @type {import('tailwindcss').Config} */
export default {
  // 暗色策略：跟随 body 上的 app-theme--dark class（由 stores/app-theme.ts 维护）
  darkMode: ['class', 'body.app-theme--dark'],
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"LXGW WenKai"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        display: [
          '"LXGW WenKai"',
          '"Palatino Linotype"',
          '"Times New Roman"',
          '"STSong"',
          'serif',
        ],
      },
      // 与 styles/index.css 的 --radius-* 保持一致
      borderRadius: {
        'sm': '10px',
        'md': '16px',
        'lg': '22px',
        'xl': '28px',
      },
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color, #9A6238)',
          soft: 'var(--primary-soft, rgba(154, 98, 56, 0.14))',
        },
        accent: {
          DEFAULT: 'var(--accent-color, #6E8577)',
        },
        surface: {
          DEFAULT: 'var(--surface-color, #FDFBF6)',
          raised: 'var(--surface-raised)',
          soft: 'var(--surface-soft)',
          panel: 'var(--surface-panel-bg)',
          card: 'var(--surface-card-bg)',
          input: 'var(--surface-input-bg)',
        },
        muted: {
          DEFAULT: 'var(--text-secondary, #6F675B)',
        },
      },
    },
  },
  plugins: [],
}
