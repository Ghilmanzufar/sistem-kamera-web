export const DEFECT_KEYWORDS = [
  "ng",
  "defect",
  "cacat",
  "reject",
  "broken",
  "patah",
  "scratch",
  "dent",
  "missing",
  "crack"
];

export const getLabelValidation = (labelName) => {
  if (!labelName) {
    return {
      status: 'invalid',
      message: 'Kosong',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    };
  }

  const raw = String(labelName).trim().toLowerCase();
  const tokens = raw.split(/[-_\s]+/);
  const isDefect = tokens.some((t) => DEFECT_KEYWORDS.includes(t));

  const isFront =
    raw.startsWith('f-') ||
    raw.startsWith('f_') ||
    raw.startsWith('front-') ||
    raw.startsWith('front_');
  const isRear =
    raw.startsWith('r-') ||
    raw.startsWith('r_') ||
    raw.startsWith('rear-') ||
    raw.startsWith('rear_');

  if (isFront) {
    if (isDefect) {
      return {
        status: 'front_defect',
        isDefect: true,
        side: 'FRONT (F) • DEFECT / NG',
        color: 'text-rose-300 bg-rose-500/20 border-rose-400/40',
        icon: '⚠️'
      };
    }
    return {
      status: 'front',
      isDefect: false,
      side: 'FRONT (F)',
      color: 'text-sky-300 bg-sky-500/20 border-sky-400/30',
      icon: 'F'
    };
  }

  if (isRear) {
    if (isDefect) {
      return {
        status: 'rear_defect',
        isDefect: true,
        side: 'REAR (R) • DEFECT / NG',
        color: 'text-rose-300 bg-rose-500/20 border-rose-400/40',
        icon: '⚠️'
      };
    }
    return {
      status: 'rear',
      isDefect: false,
      side: 'REAR (R)',
      color: 'text-amber-300 bg-amber-500/20 border-amber-400/30',
      icon: 'R'
    };
  }

  return {
    status: 'warning',
    isDefect: isDefect,
    side: isDefect ? '⚠️ Non-Standar (Defect NG)' : '⚠️ Non-Standar',
    color: 'text-rose-300 bg-rose-500/20 border-rose-400/40',
    icon: '!'
  };
};
