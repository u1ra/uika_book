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
          '"Plus Jakarta Sans"',
          '"Nunito"',
          '"HarmonyOS Sans SC"',
          '"MiSans"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        display: [
          '"Plus Jakarta Sans"',
          '"Nunito"',
          '"HarmonyOS Sans SC"',
          '"MiSans"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        reader: [
          '"LXGW WenKai"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
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
          DEFAULT: 'var(--primary-color, #7C5CE6)',
          soft: 'var(--primary-soft, rgba(124, 92, 230, 0.13))',
        },
        accent: {
          DEFAULT: 'var(--accent-color, #D49B35)',
        },
        surface: {
          DEFAULT: 'var(--surface-color, #FFFFFF)',
          raised: 'var(--surface-raised)',
          soft: 'var(--surface-soft)',
          panel: 'var(--surface-panel-bg)',
          card: 'var(--surface-card-bg)',
          input: 'var(--surface-input-bg)',
        },
        muted: {
          DEFAULT: 'var(--text-secondary, #6E6687)',
        },
      },
    },
  },
  plugins: [],
}
