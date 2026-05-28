const subtitleCues = [
  'This is my first AI-powered website.',
  'A small interface, built with a new kind of co-pilot.',
  'Every scroll turns a prompt into motion.',
  'Every panel is a saved checkpoint of learning.',
  'GGBOND-25 is not finished. It is coming online.',
];

export function OpeningSubtitles() {
  return (
    <section className="opening-subtitles" aria-label="AI-powered website opening subtitles">
      {subtitleCues.map((cue, index) => (
        <p className="subtitle-cue reveal-section" data-reveal-index={`subtitle-${index}`} key={cue}>
          <span>{cue}</span>
        </p>
      ))}
    </section>
  );
}
