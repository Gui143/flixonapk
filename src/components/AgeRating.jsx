// Badge de Classificação Indicativa (estilo DJCTQ brasileiro)
// Cores oficiais conforme resolução.
const AGE_STYLES = {
  L: { bg: '#00A859', color: '#ffffff', label: 'L' },
  '10': { bg: '#00AEEF', color: '#ffffff', label: '10' },
  '12': { bg: '#FFF200', color: '#000000', label: '12' },
  '14': { bg: '#F26522', color: '#ffffff', label: '14' },
  '16': { bg: '#ED1C24', color: '#ffffff', label: '16' },
  '18': { bg: '#000000', color: '#ffffff', label: '18' }
};

export const AGE_RATINGS = ['L', '10', '12', '14', '16', '18'];

export function getAgeStyle(rating) {
  if (!rating) return null;
  const r = String(rating).trim().toUpperCase();
  return AGE_STYLES[r] || null;
}

export default function AgeRating({ rating, size = 32 }) {
  const style = getAgeStyle(rating);
  if (!style) return null;
  return (
    <span
      className="inline-flex items-center justify-center font-extrabold rounded-md leading-none shrink-0"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        width: size,
        height: size * 0.8,
        fontSize: size * 0.4,
        border: style.bg === '#000000' ? '1px solid #333' : 'none'
      }}
      title={`Classificação ${style.label}`}
    >
      {style.label}
    </span>
  );
}
