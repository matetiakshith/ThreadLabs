export default function Wordmark() {
  return <span className="brand-lockup"><span className="wordmark" aria-label="ThreadLabs">{'THREADLABS'.split('').map((letter,index)=><span className="brand-glyph" aria-hidden="true" key={index}>{letter}</span>)}</span><span className="brand-credit">by The Beatles</span></span>;
}
