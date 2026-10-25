import gsap from 'gsap';
export function animateEditorial(root) {
 const gallery=root.querySelector('.craft-editorial');
 const entrance={trigger:gallery,start:'top 92%',end:'top 32%',scrub:true,invalidateOnRefresh:true};
 const craft=gsap.timeline({scrollTrigger:entrance});
 craft.fromTo(gallery.querySelector('.craft-weaver .craft-image-mask'),{clipPath:'polygon(0 100%,25% 85%,60% 98%,100% 72%,100% 100%,0 100%)'},{clipPath:'polygon(0 7%,25% 0%,60% 3%,100% 0%,100% 100%,0 100%)',duration:1,ease:'power2.out'},0)
  .fromTo(gallery.querySelectorAll('.craft-portrait:not(.craft-weaver)'),{y:38,opacity:.15},{y:0,opacity:1,stagger:.12,duration:.65,ease:'power2.out'},.12)
  .fromTo(gallery.querySelector('.craft-connection path'),{strokeDashoffset:1},{strokeDashoffset:0,duration:1,ease:'none'},.1);
 const network=gsap.timeline({scrollTrigger:{trigger:root.querySelector('.network-composition'),start:'top 90%',end:'top 18%',scrub:true,invalidateOnRefresh:true}});
 network.fromTo(root.querySelector('.network-map-stage'),{y:35,clipPath:'inset(0 0 90% 0 round 35%)'},{y:0,clipPath:'inset(0 0 0% 0 round 0%)',duration:1,ease:'power2.out'},0)
  .fromTo(root.querySelectorAll('.network-routes path'),{strokeDashoffset:1},{strokeDashoffset:0,duration:.75,stagger:.1,ease:'none'},.35);
 return()=>{craft.kill();network.kill();};
}
