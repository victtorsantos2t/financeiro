/**
 * Utilitários de Tema Profissionais para o Sistema Financeiro
 */

interface HSL {
    h: number;
    s: number;
    l: number;
}

const colorMap: Record<string, string> = {
    // Cores Genéricas
    blue: "#2563eb",
    black: "#0f172a",
    gray: "#64748b",
    green: "#10b981",
    purple: "#8b5cf6",
    red: "#ef4444",
    orange: "#f59e0b",

    // Bancos Principais
    nubank: "#820ad1",
    itau: "#ec7000",
    inter: "#ff7a00",
    santander: "#cc0000",
    "banco-pan": "#00bef0",
    "mercado-pago": "#009ee3"
};

/**
 * Converte uma cor Hexadecimal para HSL
 */
export function hexToHsl(hex: string): HSL {
    // Remover o # se presente
    hex = hex.replace(/^#/, "");

    // Expandir hex curto (ex: "03F") para longo ("0033FF")
    if (hex.length === 3) {
        hex = hex.split("").map(x => x + x).join("");
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * Gera um gradiente premium de 3 estágios baseado em uma cor base
 */
export function generateCardGradient(baseColor: string): string {
    let hsl: HSL;

    if (baseColor.startsWith("hsl")) {
        // Parse HSL simple: "hsl(220, 70%, 50%)"
        const matches = baseColor.match(/\d+/g);
        if (matches && matches.length >= 3) {
            hsl = { h: parseInt(matches[0]), s: parseInt(matches[1]), l: parseInt(matches[2]) };
        } else {
            hsl = { h: 220, s: 70, l: 50 }; // Fallback blue
        }
    } else {
        const hex = colorMap[baseColor.toLowerCase()] || baseColor;
        hsl = hexToHsl(hex);
    }

    // Ajustar intensidades para o gradiente
    const darker = `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(0, hsl.l - 20)}%)`;
    const lighter = `hsl(${hsl.h}, ${hsl.s}%, ${Math.min(100, hsl.l + 15)}%)`;
    const base = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    return `linear-gradient(135deg, ${darker} 0%, ${base} 50%, ${lighter} 100%)`;
}

/**
 * Retorna a cor de contraste ideal (Branco ou Slate-900) para uma cor base
 */
export function getContrastColor(baseColor: string): "white" | "#0f172a" {
    let hsl: HSL;

    if (baseColor.startsWith("hsl")) {
        const matches = baseColor.match(/\d+/g);
        if (matches && matches.length >= 3) {
            hsl = { h: parseInt(matches[0]), s: parseInt(matches[1]), l: parseInt(matches[2]) };
        } else {
            hsl = { h: 0, s: 0, l: 0 };
        }
    } else {
        const hex = colorMap[baseColor.toLowerCase()] || baseColor;
        hsl = hexToHsl(hex);
    }

    // Se a luminosidade for maior que 65%, use texto escuro
    if (hsl && hsl.l > 65) return "#0f172a";
    return "white";
}
