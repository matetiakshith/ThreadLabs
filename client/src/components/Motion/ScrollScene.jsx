/** GSAP owns scroll transforms. Motion continues to own local product transitions. */
export default function ScrollScene({as:Component='div',name,treatment='parallax',children,className='',...props}) {
  return <Component {...props} className={`${className} scroll-scene`} data-motion-scene={name} data-motion-library="GSAP ScrollTrigger" data-motion-treatment={treatment}>{children}</Component>;
}
export function ScrollType({children,className=''}) {
  // Typography inherits its exact original spacing; the scoped heading timeline
  // reveals it without continuously changing font metrics while users read.
  return <span className={`scroll-type ${className}`}>{children}</span>;
}
