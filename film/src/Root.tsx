import { loadFont } from '@remotion/google-fonts/Inter';
import { AbsoluteFill, Composition, Sequence, useCurrentFrame } from 'remotion';
import '../../src/index.css';
import './film.css';
import { ChapterLabel, Wordmark } from './motion';
import { LetDoChapter } from './scenes/LetDo';
import { ShowChapter } from './scenes/Show';
import { CHAPTER, FPS, HEIGHT, SHOT, SLICE, TOTAL, WIDTH, dur } from './timeline';

loadFont('normal', { weights: ['400', '600', '700', '800'], subsets: ['latin'] });

/** The whole film on an absolute timeline; chapters are Sequences, overlays read the absolute frame. */
export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#14171d' }}>
      <Sequence from={CHAPTER.show[0]} durationInFrames={dur(CHAPTER.show)} name="SHOW"><ShowChapter /></Sequence>
      <Sequence from={CHAPTER.letdo[0]} durationInFrames={dur(CHAPTER.letdo)} name="LET DO"><LetDoChapter /></Sequence>
      {/* persistent overlays */}
      <ChapterLabel text="SHOW" start={CHAPTER.show[0]} end={CHAPTER.letdo[0]} />
      <ChapterLabel text="LET DO" start={CHAPTER.letdo[0]} end={CHAPTER.talk[0]} />
      <Wordmark start={SHOT.s3[0] + 30} />
      {frame < 0 && null}
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
