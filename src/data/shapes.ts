/**
 * Approximate quarterly total returns (percent) of the S&P 500 for years with a famous intra-year shape.
 * Kidvest only uses them as the *shape* inside a year: every year is rescaled so that the four quarters
 * compound exactly to the official annual figure in history.ts. Years not listed get a seeded random shape.
 */
export const STOCK_QUARTER_SHAPES: Record<number, [number, number, number, number]> = {
  1987: [21.3, 5.0, 6.6, -22.5],
  2000: [2.3, -2.7, -1.0, -7.8],
  2001: [-11.9, 5.9, -14.7, 10.7],
  2002: [0.3, -13.4, -17.3, 8.4],
  2008: [-9.4, -2.7, -8.4, -21.9],
  2009: [-11.0, 15.9, 15.6, 6.0],
  2020: [-19.6, 20.5, 8.9, 12.1],
  2022: [-4.6, -16.1, -4.9, 7.6],
};
