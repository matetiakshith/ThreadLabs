import { Router } from 'express';
import { asyncRoute } from './phase2.js';
export const directoryProfile = row => ({
 id:row.artisan_id,name:row.payload.studioName,state:row.payload.state,location:row.payload.city,
 bio:row.payload.bio||'',specialties:row.payload.specializations||[],textiles:row.payload.materials||[],
 experienceYears:row.payload.experienceYears||0,stitchingExp:row.payload.experienceYears?`${row.payload.experienceYears} years`:'Not specified',
 verified:false,registered:true,rating:0,reviewsCount:0,priceRange:'Confirm with artisan',estimatedDays:'Confirm with artisan',
 availability:'Accepting enquiries',avatar:'/images/beatle.svg',recentWorks:[],
});
export async function publishedArtisans(store) {
 if(!store)return [];
 return (await store.pool.query("SELECT a.artisan_id,p.payload FROM threadlabs_accounts a JOIN threadlabs_profiles p ON a.id=p.account_id WHERE a.role='artisan' AND p.payload->>'published'='true'")).rows.map(directoryProfile);
}
export function artisanDirectoryRoutes({store}) {const router=Router();router.get('/',asyncRoute(async(_req,res)=>res.json(await publishedArtisans(store))));return router;}
