# JURA Consulting

Монгол интерфейстэй үйлчилгээ, өдөр тутмын дадал, Academy болон админ систем.

Hostinger VPS хувилбар · үндсэн домэйн **https://jura.consulting**.

## Шинэ VPS дээр суулгах

Ubuntu 26.04-ийн root терминалд:

```bash
git clone https://github.com/davaasurenbattogtokh-cmyk/jura.git /opt/jura-consulting
cd /opt/jura-consulting
bash scripts/install.sh
```

Суулгагч Docker шаардлагатай бол суулгаж, анхны `Juradmin` нууц үгийг терминалд нууж оруулахыг хүснэ. Node.js-ийг хост дээр тусад нь суулгахгүй.

| DNS төрөл | Нэр | Зорилтот утга |
| --- | --- | --- |
| A | @ | VPS_IP_ADDRESS |
| CNAME | www | jura.consulting |

Бодит VPS суулгалт болон DNS/HTTPS баталгаажуулалт хийгдээгүй. Docker бүтцийн болон shell синтаксын шалгалт хийсэн; контейнерүүдийг бодит Docker орчинд ажиллуулж шалгаагүй. Одоогийн Cloudflare D1/R2 өгөгдөл автоматаар шилжихгүй.

Дэлгэрэнгүй суулгалт, хадгалалт, нөөцлөлт, имэйл тохиргоо: [Монгол заавар](README_MN.md).

## Хөгжүүлэлт ба шалгалт

Node.js 24:

```bash
npm install
npm test
npm run build
```

VPS хувилбарын 76 интеграцийн шалгалт болон Next.js production build амжилттай. Тестүүд түр SQLite өгөгдлийн сан, санамсаргүй нууц үг ашиглаж, гадагш имэйл илгээхгүй.

Next.js / React / TypeScript · SQLite · локал хувийн файл хадгалалт · Docker Compose / Caddy · Resend (сонголтоор).

## Шинэчлэх

```bash
cd /opt/jura-consulting
bash scripts/update.sh
```

Энэ команд Git-ээс шинэ код татаж, нөөцлөөд дахин build хийнэ. Автомат CI/CD хараахан тохируулаагүй.

`.env`, өгөгдлийн сан, хэрэглэгчийн файл, админы нууц үг болон бусад түлхүүр repository-д байхгүй.
