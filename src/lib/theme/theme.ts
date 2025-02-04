export const theme = {
  colors: {
    primary: 'rgba(88, 101, 242, 1)',
    secondary: 'rgba(45, 136, 255, 0.8)',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    glass: 'rgba(255, 255, 255, 0.03)',
    accent: '#6EE7B7'
  },
  blur: {
    standard: '20px',
    heavy: '40px'
  }
} as const;

export type Theme = typeof theme; 