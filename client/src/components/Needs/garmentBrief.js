/** A local index of explicit terms. The entire original brief is authoritative. */
const categories = ['t-shirt','shirt','hoodie','sherwani','kurta','kurti','jacket','blazer','trousers','jeans','lehenga','saree','dress','skirt','gown','coat','shorts','pants','top'];
const textiles = ['raw silk','silk','linen','cotton','denim','velvet','wool','satin','chiffon','leather','nylon','khadi','brocade'];
const fits = ['oversized','relaxed','slim fit','tailored','contemporary silhouette','cropped','flared','fitted'];
const colours = { ivory:'#fdfbf7', white:'#ffffff', black:'#171717', red:'#ac3434', gold:'#b8965d', blue:'#345988', green:'#42694a', pink:'#d8a3af', grey:'#777777', gray:'#777777', cream:'#efe4c7', indigo:'#303c75', purple:'#795a8e', brown:'#765143', yellow:'#d3b94c', orange:'#c98745' };
const contains = (text, term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
export function buildGarmentBrief(raw, measurements = null, lengthRequirement = '', inputMethod = 'text') {
  const garments = categories.filter(term => contains(raw,term) && !(term === 'shirt' && contains(raw,'t-shirt')) && !(term === 'top' && contains(raw,'crop top')));
  const material = textiles.filter(term => contains(raw,term));
  const palette = Object.entries(colours).filter(([term]) => contains(raw,term));
  const fit = fits.filter(term => contains(raw,term));
  return {
    title: garments.length ? garments.map(term=>term[0].toUpperCase()+term.slice(1)).join(' & ') : 'Your custom garment',
    garments: (garments.length ? garments : ['Custom garment']).map(name=>({ name, fabric: garments.length > 1 ? 'See original brief — confirm per garment' : material.join(' · ') || 'Not specified — confirm with your artisan', color: garments.length > 1 ? 'See original brief — confirm per garment' : palette.map(([term])=>term).join(' · ') || 'Not specified — confirm with your artisan' })),
    style: 'As described in your original brief', fit: fit.join(' · ') || 'Confirm with your artisan',
    colourTerms: palette.map(([term])=>term), colorPalette: palette.map(([,hex])=>hex),
    occasion: /\bwedding\b/i.test(raw) ? 'Wedding' : /\bcasual\b/i.test(raw) ? 'Casual' : 'Not specified',
    estimatedCost: 'Artisan quote required', estimatedDays: 'Confirm with your artisan',
    userPrompt: raw, requirements: raw, measurements, lengthRequirement, inputMethod,
  };
}
