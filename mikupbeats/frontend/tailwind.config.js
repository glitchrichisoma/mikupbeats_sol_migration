import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['index.html', 'src/**/*.{js,ts,jsx,tsx,html,css}'],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: 'oklch(var(--border))',
                input: 'oklch(var(--input))',
                ring: 'oklch(var(--ring))',
                background: 'oklch(var(--background))',
                foreground: 'oklch(var(--foreground))',
                primary: {
                    DEFAULT: 'oklch(var(--primary))',
                    foreground: 'oklch(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'oklch(var(--secondary))',
                    foreground: 'oklch(var(--secondary-foreground))'
                },
                destructive: {
                    DEFAULT: 'oklch(var(--destructive))',
                    foreground: 'oklch(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'oklch(var(--muted))',
                    foreground: 'oklch(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'oklch(var(--accent))',
                    foreground: 'oklch(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'oklch(var(--popover))',
                    foreground: 'oklch(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'oklch(var(--card))',
                    foreground: 'oklch(var(--card-foreground))'
                },
                chart: {
                    1: 'oklch(var(--chart-1))',
                    2: 'oklch(var(--chart-2))',
                    3: 'oklch(var(--chart-3))',
                    4: 'oklch(var(--chart-4))',
                    5: 'oklch(var(--chart-5))'
                },
                sidebar: {
                    DEFAULT: 'oklch(var(--sidebar))',
                    foreground: 'oklch(var(--sidebar-foreground))',
                    primary: 'oklch(var(--sidebar-primary))',
                    'primary-foreground': 'oklch(var(--sidebar-primary-foreground))',
                    accent: 'oklch(var(--sidebar-accent))',
                    'accent-foreground': 'oklch(var(--sidebar-accent-foreground))',
                    border: 'oklch(var(--sidebar-border))',
                    ring: 'oklch(var(--sidebar-ring))'
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            boxShadow: {
                xs: '0 1px 2px 0 rgba(0,0,0,0.05)'
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'pulse-glow': {
                    '0%, 100%': { filter: 'drop-shadow(0 0 30px rgba(169, 112, 255, 0.6))' },
                    '50%': { filter: 'drop-shadow(0 0 50px rgba(169, 112, 255, 0.9))' }
                },
                'border-glow': {
                    '0%, 100%': { boxShadow: '0 0 40px rgba(169, 112, 255, 0.3)' },
                    '50%': { boxShadow: '0 0 60px rgba(169, 112, 255, 0.5)' }
                },
                'bounce-slow': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                'studio-breathe': {
                    '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
                    '50%': { opacity: '0.25', transform: 'scale(1.05)' }
                },
                'gradient-breathe': {
                    '0%, 100%': { opacity: '0.8' },
                    '50%': { opacity: '1' }
                },
                'pulse-orb-1': {
                    '0%, 100%': { opacity: '0.25', transform: 'scale(1) translate(0, 0)' },
                    '33%': { opacity: '0.35', transform: 'scale(1.1) translate(10px, -10px)' },
                    '66%': { opacity: '0.3', transform: 'scale(0.95) translate(-10px, 10px)' }
                },
                'pulse-orb-2': {
                    '0%, 100%': { opacity: '0.2', transform: 'scale(1) translate(0, 0)' },
                    '33%': { opacity: '0.3', transform: 'scale(0.9) translate(-15px, 15px)' },
                    '66%': { opacity: '0.25', transform: 'scale(1.15) translate(15px, -15px)' }
                },
                'float-particle': {
                    '0%': { transform: 'translate(0, 0) scale(1)', opacity: '0' },
                    '10%': { opacity: '0.3' },
                    '90%': { opacity: '0.3' },
                    '100%': { transform: 'translate(var(--float-x, 50px), var(--float-y, -100px)) scale(0.5)', opacity: '0' }
                },
                'equipment-glow-1': {
                    '0%, 100%': { opacity: '0.08', filter: 'drop-shadow(0 0 15px oklch(0.68 0.20 290 / 0.3))' },
                    '50%': { opacity: '0.15', filter: 'drop-shadow(0 0 30px oklch(0.68 0.20 290 / 0.5))' }
                },
                'equipment-glow-2': {
                    '0%, 100%': { opacity: '0.08', filter: 'drop-shadow(0 0 15px oklch(0.72 0.18 290 / 0.3))' },
                    '50%': { opacity: '0.15', filter: 'drop-shadow(0 0 30px oklch(0.72 0.18 290 / 0.5))' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 1s ease-out',
                'fade-in-delay': 'fade-in 1s ease-out 0.3s both',
                'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
                'border-glow': 'border-glow 2s ease-in-out infinite',
                'bounce-slow': 'bounce-slow 2s ease-in-out infinite',
                'studio-breathe': 'studio-breathe 8s ease-in-out infinite',
                'gradient-breathe': 'gradient-breathe 6s ease-in-out infinite',
                'pulse-orb-1': 'pulse-orb-1 12s ease-in-out infinite',
                'pulse-orb-2': 'pulse-orb-2 15s ease-in-out infinite',
                'float-particle': 'float-particle 20s linear infinite',
                'equipment-glow-1': 'equipment-glow-1 4s ease-in-out infinite',
                'equipment-glow-2': 'equipment-glow-2 5s ease-in-out infinite 1s'
            }
        }
    },
    plugins: [typography, containerQueries, animate]
};
