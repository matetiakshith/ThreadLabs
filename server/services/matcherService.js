/**
 * ThreadLabs Artisan Matcher Service
 * Computes a weighted matching score between an AI Tech-Pack and master artisans.
 */

export function matchArtisans(techPack, artisansList) {
  const { craftSlug, fabric, complexityScore } = techPack;

  const scoredArtisans = artisansList.map((artisan) => {
    let score = 50; // base score
    let reasons = [];

    // 1. Craft Technique Match (Highest Weight: 35 points)
    if (artisan.craftSlug === craftSlug || artisan.craft.toLowerCase().includes(craftSlug)) {
      score += 35;
      reasons.push(`Master specialization in ${artisan.craft}`);
    } else {
      score -= 15;
    }

    // 2. Fabric Experience Match (15 points)
    const fabricLower = (fabric || "").toLowerCase();
    const hasFabricMatch = artisan.fabricsSupported.some(f => 
      fabricLower.includes(f.toLowerCase()) || f.toLowerCase().includes(fabricLower.split(" ")[0])
    );
    if (hasFabricMatch) {
      score += 15;
      reasons.push(`Extensive experience working with ${artisan.fabricsSupported[0]}`);
    } else {
      score += 5;
    }

    // 3. Experience & Track Record (Up to 10 points)
    if (artisan.experienceYears >= 20) {
      score += 10;
      reasons.push(`${artisan.experienceYears}+ years of generational craft heritage`);
    } else if (artisan.experienceYears >= 10) {
      score += 6;
      reasons.push(`${artisan.experienceYears} years of verified workshop practice`);
    }

    // 4. Rating & Satisfaction (Up to 10 points)
    if (artisan.rating >= 4.9) {
      score += 10;
      reasons.push(`Top-rated artisan (${artisan.rating} ★, ${artisan.completedOrders} orders)`);
    } else if (artisan.rating >= 4.7) {
      score += 6;
    }

    // Clamp score between 40% and 99%
    const finalScore = Math.min(99, Math.max(45, Math.round(score)));

    return {
      ...artisan,
      matchScore: finalScore,
      matchReasons: reasons.slice(0, 3),
      recommendedFor: finalScore >= 85 ? "Prime Craft Match" : "Alternative Craft Match"
    };
  });

  // Sort descending by match score
  scoredArtisans.sort((a, b) => b.matchScore - a.matchScore);

  return scoredArtisans;
}
