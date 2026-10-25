import { textileImage } from './textileAtmosphereMotion';
const portraits = [
 ['weaver', '10-artisan-weaving', 'The Weaver', 'Every thread carries a story.', 'Hands guiding threads through a traditional loom'],
 ['embroiderer', '04-embroidered-fabric', 'The Embroiderer', 'Tradition in every detail.', 'Floral embroidery on woven ivory and olive fabric'],
 ['tailor', '06-tailoring-mannequin', 'The Tailor', 'Where imagination takes shape.', 'Tailoring mannequin draped in terracotta fabric'],
 ['artisan', '07-artisan-materials', 'The Artisan', 'Craftsmanship deserves recognition.', 'Spools and textile materials on an artisan worktable'],
];
export default function ArtisanEditorial() {
 return <section className="story-editorial story-artisans" id="story-artisans" aria-labelledby="artisan-editorial-title">
  <div className="story-section-copy"><span className="story-eyebrow">BUILT FOR ARTISANS</span><h2 id="artisan-editorial-title">Empowering<br/>Hands, Everywhere</h2><p>ThreadLabs helps local tailors, weavers, and artisans share their work and connect with people who value their craft.</p><span className="craft-signature">Many hands. One shared thread.</span></div>
  <div className="craft-editorial">
   <svg className="craft-connection" viewBox="0 0 700 570" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M440 30 C700 30 670 230 415 235 S20 160 55 320 S660 320 615 450 S350 570 280 510"/></svg>
   {portraits.map(([key,asset,title,caption,alt])=><figure key={key} className={`craft-portrait craft-${key}`} tabIndex={0}>
    <div className="craft-image-mask"><img src={textileImage(asset)} width="552" height="230" alt={alt} loading="lazy"/></div>
    <figcaption><strong>{title}</strong><span>{caption}</span></figcaption>
   </figure>)}
  </div>
 </section>;
}
