import type {Metadata} from 'next';
import Jura from './jura';
export const metadata:Metadata={alternates:{canonical:'https://juras.consulting'}};
export default function Page(){return <Jura/>}
