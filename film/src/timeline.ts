/** Single source of truth for every shot's timing. Seconds in the storyboard, frames here. */
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const sec = (s: number) => Math.round(s * FPS);

type Span = readonly [start: number, end: number];

export const SHOT = {
  s1: [sec(0), sec(4.5)] as Span,
  s2: [sec(4.5), sec(8)] as Span,
  s3: [sec(8), sec(14)] as Span,
  s4: [sec(14), sec(21)] as Span,
  s5: [sec(21), sec(26)] as Span,
  s6: [sec(26), sec(32)] as Span,
  s7: [sec(32), sec(37)] as Span,
  s8: [sec(37), sec(46)] as Span,
  s9: [sec(46), sec(52)] as Span,
  s10: [sec(52), sec(58)] as Span,
  s11: [sec(58), sec(63)] as Span,
  s12: [sec(63), sec(72)] as Span,
  s13: [sec(72), sec(80)] as Span,
  s14: [sec(80), sec(85)] as Span,
  s15: [sec(85), sec(90)] as Span,
};

export const CHAPTER = {
  hook: [SHOT.s1[0], SHOT.s2[1]] as Span,
  show: [SHOT.s3[0], SHOT.s6[1]] as Span,
  letdo: [SHOT.s7[0], SHOT.s10[1]] as Span,
  talk: [SHOT.s11[0], SHOT.s13[1]] as Span,
  payoff: [SHOT.s14[0], SHOT.s15[1]] as Span,
};

export const TOTAL = sec(90);

/** Milestone 1 vertical slice: SHOW plus the first LET DO shot. */
export const SLICE = [SHOT.s3[0], SHOT.s7[1]] as Span;

export const dur = (s: Span) => s[1] - s[0];
