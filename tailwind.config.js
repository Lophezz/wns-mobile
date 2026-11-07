/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#b30016", // Vermelho principal da WNS
          dark: "#800010",    // Vermelho escuro (gradiente dos cards)
          light: "#fff6f7",   // Fundo suave de aviso
        },
        accent: "#ffb400",    // Amarelo/Dourado de destaque
        surface: "#f6f6f6",   // Cinza claro de fundo das seções
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
      },
    },
  },
  plugins: [],
};