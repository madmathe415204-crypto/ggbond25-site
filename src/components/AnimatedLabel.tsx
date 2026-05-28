type AnimatedLabelProps = {
  children: string;
};

export function AnimatedLabel({children}: AnimatedLabelProps) {
  return (
    <span className="animated-label" aria-label={children}>
      {children.split('').map((letter, index) => (
        <span key={`${letter}-${index}`} style={{animationDelay: `${index * 28}ms`}}>
          {letter === ' ' ? '\u00a0' : letter}
        </span>
      ))}
    </span>
  );
}
