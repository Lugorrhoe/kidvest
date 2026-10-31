import { loadFont } from '@remotion/google-fonts/Inter';
import { AbsoluteFill, Composition, Sequence, useCurrentFrame } from 'remotion';
import '../../src/index.css';
import './film.css';
import { ChapterLabel, Wordmark } from './motion';
import { HookChapter } from './scenes/Hook';
import { LetDoChapter } from './scenes/LetDo';
import { PayoffChapter } from './scenes/Payoff';
import { ShowChapter } from './scenes/Show';
import { TalkChapter } from './scenes/Talk';
import { CHAPTER, FPS, HEIGHT, SHOT, SLICE, TOTAL, WIDTH, dur } from './timeline';

loadFont('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });

/** The whole film on an absolute timeline; chapters are Sequences, overlays read the absolute frame. */
export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#14171d', ['--t' as string]: frame / FPS }}>
      <Sequence from={CHAPTER.hook[0]} durationInFrames={dur(CHAPTER.hook)} name="HOOK"><HookChapter /></Sequence>
      <Sequence from={CHAPTER.show[0]} durationInFrames={dur(CHAPTER.show)} name="SHOW"><ShowChapter /></Sequence>
      <Sequence from={CHAPTER.letdo[0]} durationInFrames={dur(CHAPTER.letdo)} name="LET DO"><LetDoChapter /></Sequence>
      <Sequence from={CHAPTER.talk[0]} durationInFrames={dur(CHAPTER.talk)} name="TALK"><TalkChapter /></Sequence>
      <Sequence from={CHAPTER.payoff[0]} durationInFrames={dur(CHAPTER.payoff)} name="PAYOFF"><PayoffChapter /></Sequence>
      {/* persistent overlays */}
      <ChapterLabel text="SHOW" start={CHAPTER.show[0]} end={CHAPTER.letdo[0]} />
      <ChapterLabel text="LET DO" start={CHAPTER.letdo[0]} end={CHAPTER.talk[0]} />
      <ChapterLabel text="TALK" start={CHAPTER.talk[0]} end={CHAPTER.payoff[0]} />
      <Wordmark start={SHOT.s3[0] + 30} end={SHOT.s15[0] + 20} />
    </AbsoluteFill>
  );
};

const Slice: React.FC = () => (
  <Sequence from={-SLICE[0]} durationInFrames={TOTAL}>
    <Film />
  </Sequence>
);

export const Root: React.FC = () => (
  <>
    <Composition id="KidvestFilm" component={Film} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Slice" component={Slice} durationInFrames={dur(SLICE)} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
