/** @type {import('tailwindcss').Config} */

function makeColorPalette(color) {
  return {
		DEFAULT: color,
    50: `color-mix(in srgb, ${color} 5%, white)`,
    100: `color-mix(in srgb, ${color} 10%, white)`,
    200: `color-mix(in srgb, ${color} 30%, white)`,
    300: `color-mix(in srgb, ${color} 50%, white)`,
    400: `color-mix(in srgb, ${color} 70%, white)`,
    500: color,
    600: `color-mix(in srgb, ${color} 70%, black)`,
    700: `color-mix(in srgb, ${color} 50%, black)`,
    800: `color-mix(in srgb, ${color} 30%, black)`,
    900: `color-mix(in srgb, ${color} 10%, black)`,
  };
}

export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
				vrclo1: makeColorPalette('hsl(var(--primary))'), // main theme color
				vrclo2: makeColorPalette('hsl(var(--secondary))'), // sub theme color
				vrclo3: makeColorPalette('hsl(var(--tertiary))'), // sub theme color
				text: {
					DEFAULT: 'hsl(var(--text))',
					inverted: 'hsl(var(--text-inverted))',
				},
				compatibilitystatus: {
					official: {
						DEFAULT: 'hsl(var(--status-official))',
						foreground: 'hsl(var(--status-official-foreground))'
					},
					modified: {
						DEFAULT: 'hsl(var(--status-modified))',
						foreground: 'hsl(var(--status-modified-foreground))'
					},
					unsupported: {
						DEFAULT: 'hsl(var(--status-unsupported))',
						foreground: 'hsl(var(--status-unsupported-foreground))'
					}
				},


				// shadcn UI colors
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
					DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
					DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

