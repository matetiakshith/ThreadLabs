# India artisan discovery boundaries

Source: geoBoundaries gbOpen, IND ADM1, boundary ID `IND-ADM1-1811400`, pinned revision `9469f09`.

Downloaded from [the publisher's simplified GeoJSON](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/IND/ADM1/geoBoundaries-IND-ADM1_simplified.geojson). The publisher attributes the source to **DataMeet India community and the Election Commission of India**. The original publisher metadata is saved verbatim as `india-states-source.json`.

Licence: [Creative Commons Attribution 2.5 India](https://creativecommons.org/licenses/by/2.5/in/), as specified for this dataset in the publisher metadata and [DataMeet's state boundary project](https://projects.datameet.org/maps/states/). Attribution and the licence link also appear beneath the map. DataMeet's current repository-wide README instead describes CC BY 4.0; this copy retains the more specific licence supplied with this release.

The source metadata labels the represented boundary year 2011, the source update January 19, 2023 and the build December 12, 2023. Its actual features cover 28 states and 8 union territories, including Telangana, Ladakh and the merged Dadra and Nagar Haveli and Daman and Diu. It is community-maintained, ECI-derived data, **not a certified current Survey of India administrative database**. [Survey of India's official map portal](https://surveyofindia.gov.in/pages/outline-maps-of-india) remains the authority for official boundaries. No claim of official certification or current survey precision is made.

The northern territorial extent, disputed boundaries and internal administrative boundaries are displayed exactly as this source supplies them. No disputed geometry is inferred, joined from another source, extended or silently edited. This release includes India's claimed northern territorial extent (Ladakh reaches approximately 37.0775° N).

`india-states.geojson` is this source with whitespace compacted only: every feature, property and coordinate is unchanged. The publisher already simplified the geometry; ThreadLabs does **not** further simplify it. It contains 116,391 ring vertices. WGS84 coordinates use `[longitude, latitude]`. Display uses one shared Mercator projection, centered/scaled for the viewport. Island and enclave coordinates use the same projection without relocation or insets. The rendering preserves exterior rings, interior holes, 187 Andaman/Nicobar polygons, 22 Lakshadweep polygons, 21 Puducherry polygons and the three disconnected polygons of the merged western UT. Search names join to the marketplace by ISO code; original source names remain unchanged in the asset.

Original download SHA-256: `4c63fe43294a391e8f2de4e9f86f3edb60f8688275b9fee90c61fb2aa0c26061`.

## Requested reference audit

The requested repository has the file at [`indian-states.geojson` on its master branch](https://github.com/iamaanahmad/GeoJson-of-Indian-States/blob/master/indian-states.geojson). It is a WGS84 FeatureCollection with 36 names. It was not used: the README offers educational/development use without a clear standard reuse licence or verifiable boundary lineage. Its actual Andaman/Nicobar geometry is a single six-coordinate ring near Port Blair, omitting the archipelago; other boundaries are extremely sparse. This does not satisfy the requested coverage and authentic island geography. Missing boundaries were not invented.
