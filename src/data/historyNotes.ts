/**
 * One-line context for notable calendar years, shown to parents only (children never see real dates).
 * `talk` is a conversation starter for the years worth discussing at the kitchen table.
 */
export interface HistoryNote {
  kind: 'crash' | 'boom' | 'event';
  text: string;
  talk?: string;
}

export const HISTORY_NOTES: Record<number, HistoryNote> = {
  1928: { kind: 'boom', text: 'The last full year of the Roaring Twenties.' },
  1929: { kind: 'crash', text: 'The Wall Street Crash in October ends the Roaring Twenties.', talk: 'What would you do if everything you own lost half its value in a few weeks?' },
  1930: { kind: 'crash', text: 'The Great Depression deepens; banks start to fail.' },
  1931: { kind: 'crash', text: 'The worst year ever for US stocks. Three losing years in a row.', talk: 'Why do you think people kept investing after years like this?' },
  1932: { kind: 'crash', text: 'The bottom of the Great Depression.' },
  1933: { kind: 'boom', text: 'The New Deal begins and stocks rebound sharply from the bottom.' },
  1937: { kind: 'crash', text: 'A recession inside the Depression; stocks fall hard again.' },
  1941: { kind: 'event', text: 'The United States enters the Second World War.' },
  1942: { kind: 'boom', text: 'Markets turn around mid-war and start a long recovery.' },
  1946: { kind: 'event', text: 'Post-war inflation jumps as price controls end.' },
  1954: { kind: 'boom', text: 'Stocks finally pass their 1929 peak, 25 years later.' },
  1962: { kind: 'event', text: 'A sharp spring sell-off and the Cuban Missile Crisis.' },
  1966: { kind: 'event', text: 'The start of a long sideways decade with rising inflation.' },
  1973: { kind: 'crash', text: 'The oil crisis begins; prices soar and stocks fall.' },
  1974: { kind: 'crash', text: 'Second year of the oil shock. Inflation above 12 %.', talk: 'In this year everything got more expensive and investments fell. What is worse for a saver?' },
  1975: { kind: 'boom', text: 'A strong recovery after the two-year slump.' },
  1979: { kind: 'event', text: 'Inflation nears 13 %; the central bank starts to fight it.' },
  1980: { kind: 'event', text: 'Gold peaks and interest rates reach record highs.' },
  1981: { kind: 'event', text: 'Interest rates near 20 % push the economy into recession.' },
  1982: { kind: 'boom', text: 'Inflation is beaten; the start of a long bull market.' },
  1987: { kind: 'crash', text: 'Black Monday, 19 October: stocks drop over 20 % in one day, yet the year still ends positive.', talk: 'The market crashed in one day and had recovered by the end of the year. Who lost money, and who did not?' },
  1990: { kind: 'event', text: 'Gulf War, oil price spike and a short recession.' },
  1995: { kind: 'boom', text: 'The internet boom begins. First of five huge years.' },
  1998: { kind: 'event', text: 'Asian and Russian crises cause a sharp autumn dip, then a quick recovery.' },
  1999: { kind: 'boom', text: 'Peak of the dot-com mania. Internet companies worth billions without profits.' },
  2000: { kind: 'crash', text: 'The dot-com bubble bursts in March.', talk: 'Everyone said internet companies could only go up. Why is "everyone agrees" a warning sign?' },
  2001: { kind: 'crash', text: 'Recession and the 11 September attacks. Second losing year.' },
  2002: { kind: 'crash', text: 'Third losing year in a row; accounting scandals at Enron and WorldCom.', talk: 'Three bad years in a row. How does it feel to keep going?' },
  2003: { kind: 'boom', text: 'Recovery begins after the three-year bust.' },
  2006: { kind: 'event', text: 'US house prices peak.' },
  2007: { kind: 'event', text: 'The housing bubble starts to deflate; first banks run into trouble.' },
  2008: { kind: 'crash', text: 'The global financial crisis. Lehman Brothers collapses; stocks lose about 37 %.', talk: 'Your child just lived through 2008. Ask what the storm felt like and whether selling crossed their mind.' },
  2009: { kind: 'boom', text: 'The low point comes in March, then a strong recovery.' },
  2010: { kind: 'event', text: 'The euro debt crisis begins; a "flash crash" in May.' },
  2011: { kind: 'event', text: 'Euro crisis and a US credit downgrade; a nervous, flat year.' },
  2013: { kind: 'boom', text: 'A strong rally as the economy heals.' },
  2018: { kind: 'event', text: 'Trade tensions and a sharp December drop.' },
  2020: { kind: 'crash', text: 'The COVID-19 pandemic: the fastest crash ever in March, fully recovered within months.', talk: 'In 2020 the world stopped and markets crashed, then recovered within months. What would have happened to someone who sold in March?' },
  2021: { kind: 'boom', text: 'A strong year with lots of hype around meme stocks and crypto.' },
  2022: { kind: 'crash', text: 'Inflation peaks and interest rates rise fast; stocks and bonds both fall, a rare combination.', talk: 'In 2022 even the "safe" bonds fell. Is anything completely safe?' },
  2023: { kind: 'boom', text: 'Excitement about artificial intelligence lifts the big technology companies.' },
  2024: { kind: 'boom', text: 'Another strong year as interest rates start to come down.' },
  2025: { kind: 'event', text: 'A tariff shock in spring, then a recovery.' },
};

export function historyNote(year: number): HistoryNote | undefined {
  return HISTORY_NOTES[year];
}
