import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{return ['','/personal','/work','/kids'].map(path=>({url:'https://juras.consulting'+path,changeFrequency:'monthly',priority:path?0.8:1}));}
