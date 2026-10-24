import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL('https://jura.consulting'),openGraph:{url:'https://jura.consulting',siteName:'JURA Consulting',locale:'mn_MN',type:'website'},title:'JURA Consulting — Эмх цэгцтэй амьдрал',description:'Хувь хүн, байгууллага, хүүхдэд зориулсан эмх цэгц, тогтвортой дадал, сургалтын нэгдсэн платформ.'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="mn"><body>{children}</body></html>}
