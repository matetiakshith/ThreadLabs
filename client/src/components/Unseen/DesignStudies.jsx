import ScrollScene from '../Motion/ScrollScene.jsx';
/** The supplied fashion board is a visual reference, not a purchasable listing. */
export default function DesignStudies() {
  return <section className="selected-creations" aria-label="Fashion design study">
    <div className="creations-heading"><span className="eyebrow">Imagination, made tangible.</span><h2 className="creations-title">A study in <em>craft.</em></h2><p className="muted">From the first silhouette to the smallest stitch.</p></div>
    <div className="creation-grid design-studies">
      <ScrollScene as="figure" name="collection-silhouette" treatment="board" className="creation-item"><div className="study-silhouette"><svg className="study-garment-crop" viewBox="140 145 338 790" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Full Lotus Legacy garment silhouette from the supplied design study"><image href="/images/threadlabs-lotus-board.jpeg" width="1122" height="1402"/></svg></div><figcaption className="creation-caption"><div><h3 className="creation-name">The Lotus Legacy</h3><p className="creation-byline">Couture lehenga · Embroidery study</p></div><span className="creation-lead">01</span></figcaption></ScrollScene>
      <ScrollScene as="figure" name="collection-fashion-board" treatment="board" className="creation-item"><div className="study-board"><img src="/images/threadlabs-lotus-board.jpeg" alt="Supplied ThreadLabs Lotus Legacy design board showing front, side and back garment views, technical drawings, materials and embroidery details" /></div><figcaption className="creation-caption"><div><h3 className="creation-name">Every detail, considered.</h3><p className="creation-byline">Garment development · Material & colour study</p></div><span className="creation-lead">02</span></figcaption></ScrollScene>
    </div>
  </section>;
}
