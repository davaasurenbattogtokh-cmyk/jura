export const pages:any={
 home:{eyebrow:'SMALL CHANGES. BIG FUTURES.',title:'Эмх цэгцтэй амьдрал.\nИлүү боломжтой ирээдүй.',description:'Хувийн орон зай, ажлын орчин, хүүхдийн өдөр тутмын дадал. Таны амьдралд тохирсон эмх цэгцийн системийг хамт бүтээнэ.',image:'/images/premium-office.webp',cta:'Үйлчилгээтэй танилцах'},
 personal:{eyebrow:'JURA PERSONAL',title:'Өөртөө цаг гарга.\nЭмх цэгцтэй амьдар.',description:'Хувийн орон зайгаа амьдралын хэмнэлдээ тохируулан цэгцэлж, өдөр бүрийн тав тухыг бүтээе.',image:'/images/jura-personal-home.webp',cta:'Үйлчилгээ авах хүсэлт илгээх'},
 work:{eyebrow:'JURA WORK',title:'Эмх цэгцтэй баг.\nИлүү бүтээмжтэй байгууллага.',description:'5S, Kaizen, дижитал зохион байгуулалт. Ажлын орчноо системтэй болгож, багийн тогтвортой дадлыг дэмжинэ.',image:'/images/jura-work-team.webp',cta:'Байгууллагын хүсэлт илгээх'},
 kids:{eyebrow:'JURA KIDS · 12–16 НАС',title:'Жижиг дадлууд.\nТом боломжийн суурь.',description:'Өөрийн орон зайдаа эзэн болж, суралцах орчноо удирдах, бие даасан дадал төлөвшүүлэх 3 хичээлтэй практик хөтөлбөр.',image:'/images/jura-kids-study.webp',cta:'Хөтөлбөрт бүртгүүлэх'}
};
export const roleNames:any={admin:'Супер админ',manager:'Байгууллагын удирдлага',work:'WORK ажилтан',personal:'PERSONAL хэрэглэгч',kids:'KIDS суралцагч',parent:'Эцэг эх'};
export const defaultSettings={passMark:4,retryLimit:0,adminEmail:'organizerjura@gmail.com',reminderTime:'09:00',contactPhone:'+976 99927035',contactEmail:'organizerjura@gmail.com',contactAddress:'Дархан-Уул аймаг, Эмэгтэйчүүдийн ордон, 103 тоот'};
export function resolveSettings(saved:Partial<typeof defaultSettings>={}){
 const settings={...defaultSettings,...saved};
 // Existing installations may already have saved empty contact fields.
 for(const key of ['adminEmail','contactPhone','contactEmail','contactAddress'] as const){
  if(typeof settings[key]!=='string'||!settings[key].trim())settings[key]=defaultSettings[key];
 }
 return settings;
}
const commonSteps=[['Үнэлгээ ба төлөвлөгөө','Одоогийн орчин, хэрэгцээ, зорилгыг хамт тодорхойлно.'],['Ангилалт ба зохион байгуулалт','Зүйл бүрд тохирох байрлал, ойлгомжтой систем бүтээнэ.'],['Дадал ба тогтвортой дэмжлэг','Өдөр тутмын жижиг алхмаар үр дүнгээ хадгална.']];
for(const key of Object.keys(pages)){pages[key].sections={methodTitle:'Энгийн алхам. Тогтвортой өөрчлөлт.',steps:commonSteps,benefits:[]};}
pages.home.sections.benefits=[['Хувийн нууц, хүндлэл','Таны орон зай, шийдвэрийг хүндэтгэнэ.'],['Танд тохирсон шийдэл','Амьдралын бодит хэмнэлд нийцүүлнэ.'],['Системтэй аргачлал','Үнэлгээ, зохион байгуулалт, дадал.'],['Хүн төвтэй хандлага','Тав тух, ойлгомжтой байдлыг эрхэмлэнэ.']];
pages.personal.sections.benefits=[['Өөрийн орон зай','Танд тохирсон хадгалалт'],['Тогтвортой хэмнэл','Өдөр тутмын энгийн дадал'],['Тав тухтай амьдрал','Хэрэгцээнд нийцсэн орчин'],['Урт хугацааны өөрчлөлт','Дадлаа хадгалах систем']];
pages.work.sections.benefits=[['5S & Kaizen','Эмх цэгцийн нэгдсэн стандарт'],['Багийн оролцоо','Хүн бүрийн жижиг алхам'],['Бодит гүйцэтгэл','Даалгавар, аудит, тайлан'],['Дижитал эмх цэгц','Файл, и-мэйл, ажлын урсгал']];
pages.kids.sections={methodTitle:'3 хичээл. Өөрийн орон зайдаа эзэн бол.',benefits:[['Суралцах дадал','Өөрийн орчноо удирдах'],['Бие даасан байдал','Хариуцлагатай жижиг алхам'],['Гэр бүлийн дэмжлэг','Эцэг эхтэй хамтдаа'],['Урамтай өсөлт','Ахиц бүрээ харах']],steps:[['Орон зайн зохион байгуулалт','Өрөө, шүүгээ, эд зүйлсээ ангилж, эмхэлж сурна.'],['Tetris Method','Хязгаарлагдмал зайг ухаалгаар ашиглана.'],['Ухаалаг ширээ ба дадал','Суралцах орчноо цэгцэлж, өдөр бүр хэвшүүлнэ.']]};
