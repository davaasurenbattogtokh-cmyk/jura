import type {Metadata} from 'next';
import Jura from '../jura';
export async function generateMetadata({params}:{params:Promise<{path:string[]}>}):Promise<Metadata>{
 const {path}=await params;
 const section=path.join('/');
 if(!['personal','work','kids'].includes(section))return {robots:{index:false,follow:false}};
 return {alternates:{canonical:'https://juras.consulting/'+section},openGraph:{url:'https://juras.consulting/'+section,siteName:'JURA Consulting',type:'website'}};
}
export default function Page(){return <Jura/>}
