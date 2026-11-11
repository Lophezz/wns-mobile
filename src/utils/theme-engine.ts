import { useAccessibilityStore } from '../store/accessibility-store';

function computeThemeStyles(className: string, mode: 'dark' | 'contrast') {
  const tokens = className.trim().split(/\s+/);
  const viewStyle: Record<string, any> = {};
  const textStyle: Record<string, any> = {};

  if (mode === 'dark') {
    // PALETA DARK FOSCO (Tons Slate/Grafite suaves, sem preto puro)
    for (const t of tokens) {
      // Fundos
      if (t === 'bg-surface') viewStyle.backgroundColor = '#121826'; // Fundo geral grafite-azulado fosco
      else if (t === 'bg-white') viewStyle.backgroundColor = '#1e293b'; // Cards em cinza-ardósia fosco
      else if (t === 'bg-gray-50') viewStyle.backgroundColor = '#0f172a'; // Caixas internas/inputs
      else if (t === 'bg-gray-100') viewStyle.backgroundColor = '#334155';
      else if (t === 'bg-gray-200') viewStyle.backgroundColor = '#475569';
      else if (t === 'bg-red-50' || t === 'bg-brand-light') viewStyle.backgroundColor = '#3b1219';
      else if (t === 'bg-amber-50' || t === 'bg-amber-100') viewStyle.backgroundColor = '#3b2510';
      else if (t === 'bg-blue-50') viewStyle.backgroundColor = '#172554';
      else if (t === 'bg-green-100') viewStyle.backgroundColor = '#064e3b';

      // Bordas
      if (t === 'border-gray-100' || t === 'border-gray-200') {
        viewStyle.borderColor = '#334155';
      } else if (t === 'border-gray-300') {
        viewStyle.borderColor = '#475569';
      }

      // Textos
      if (t === 'text-gray-900' || t === 'text-gray-800') {
        textStyle.color = '#f8fafc'; // Branco suave fosco
      } else if (t === 'text-gray-700' || t === 'text-gray-600') {
        textStyle.color = '#cbd5e1'; // Cinza claro de leitura
      } else if (t === 'text-gray-500' || t === 'text-gray-400') {
        textStyle.color = '#94a3b8'; // Cinza médio para subtítulos
      } else if (t === 'text-brand') {
        textStyle.color = '#ff4d63'; // Vermelho WNS mais claro para destacar no fundo escuro
      } else if (t === 'text-green-700' || t === 'text-green-800') {
        textStyle.color = '#4ade80';
      } else if (t === 'text-amber-800' || t === 'text-amber-900') {
        textStyle.color = '#fbbf24';
      } else if (t === 'text-blue-700' || t === 'text-blue-800') {
        textStyle.color = '#60a5fa';
      }
    }
  } else {
    // PALETA ALTO CONTRASTE (Preto + Bordas Amarelas + Textos Amarelos/Brancos de máxima visibilidade)
    for (const t of tokens) {
      if (t === 'bg-surface') viewStyle.backgroundColor = '#000000';
      else if (t === 'bg-white') {
        viewStyle.backgroundColor = '#0a0a0a';
        viewStyle.borderColor = '#ffb400';
        viewStyle.borderWidth = 2;
      } else if (
        t === 'bg-gray-50' ||
        t === 'bg-gray-100' ||
        t === 'bg-gray-200' ||
        t === 'bg-red-50' ||
        t === 'bg-amber-50' ||
        t === 'bg-amber-100' ||
        t === 'bg-blue-50' ||
        t === 'bg-green-100'
      ) {
        viewStyle.backgroundColor = '#141414';
        viewStyle.borderColor = '#ffb400';
        viewStyle.borderWidth = 1;
      } else if (t === 'bg-brand') {
        viewStyle.backgroundColor = '#ffb400'; // Botões principais em amarelo de alto contraste
      }

      if (
        t === 'border-gray-100' ||
        t === 'border-gray-200' ||
        t === 'border-gray-300'
      ) {
        viewStyle.borderColor = '#ffb400';
      }

      // Textos no Alto Contraste
      if (t === 'text-gray-900' || t === 'text-gray-800') {
        textStyle.color = '#ffffff';
      } else if (t === 'text-gray-700' || t === 'text-brand') {
        textStyle.color = '#ffb400';
      } else if (t === 'text-gray-600' || t === 'text-gray-500' || t === 'text-gray-400') {
        textStyle.color = '#fffbeb';
      } else if (t === 'text-white' && tokens.includes('bg-brand')) {
        textStyle.color = '#000000';
      } else if (t === 'text-green-700' || t === 'text-green-800') {
        textStyle.color = '#4ade80';
      } else if (t === 'text-amber-800' || t === 'text-amber-900') {
        textStyle.color = '#ffb400';
      }
    }
  }

  return { viewStyle, textStyle };
}

function applyThemeToProps(type: any, props: any) {
  if (!props || typeof props.className !== 'string') return props;

  const { darkMode, highContrast } = useAccessibilityStore.getState();
  if (!darkMode && !highContrast) return props;

  const mode = highContrast ? 'contrast' : 'dark';
  const { viewStyle, textStyle } = computeThemeStyles(props.className, mode);

  const hasViewOverrides = Object.keys(viewStyle).length > 0;
  const hasTextOverrides = Object.keys(textStyle).length > 0;

  if (!hasViewOverrides && !hasTextOverrides) return props;

  const mergedOverride = { ...viewStyle, ...textStyle };
  const nextProps: Record<string, any> = {
    ...props,
    style: props.style ? [props.style, mergedOverride] : mergedOverride,
  };

  // Ajusta automaticamente a cor do placeholder dos inputs no modo escuro/alto contraste
  if (!props.placeholderTextColor) {
    nextProps.placeholderTextColor = highContrast ? '#fde047' : '#94a3b8';
  }

  return nextProps;
}

let isPatched = false;

export function installThemeEngine() {
  if (isPatched) return;
  isPatched = true;

  const wrap = (origFn: any) => {
    if (typeof origFn !== 'function') return origFn;
    // Arrow function evita o erro TS2683 ('this' implicitly has type 'any')
    return (type: any, props: any, ...rest: any[]) => {
      const themedProps = applyThemeToProps(type, props);
      return origFn(type, themedProps, ...rest);
    };
  };

  // 1. Intercepta os runtimes padrão do React
  const modulesToPatch = [
    require('react/jsx-runtime'),
    require('react/jsx-dev-runtime'),
  ];

  // 2. Intercepta também os runtimes do NativeWind e do react-native-css-interop (usados pelo Babel!)
  try {
    modulesToPatch.push(require('nativewind/jsx-runtime'));
    modulesToPatch.push(require('nativewind/jsx-dev-runtime'));
  } catch {
    // Ignora caso não exista
  }

  try {
    modulesToPatch.push(require('react-native-css-interop/jsx-runtime'));
    modulesToPatch.push(require('react-native-css-interop/jsx-dev-runtime'));
  } catch {
    // Ignora caso não exista
  }

  for (const mod of modulesToPatch) {
    if (!mod) continue;
    if (mod.jsx) mod.jsx = wrap(mod.jsx);
    if (mod.jsxs) mod.jsxs = wrap(mod.jsxs);
    if (mod.jsxDEV) mod.jsxDEV = wrap(mod.jsxDEV);
  }
}