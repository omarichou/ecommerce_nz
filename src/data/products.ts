export interface Product {
  id: string;
  title: {
    fr: string;
    ar: string;
  };
  price: number;
  ancien_price: number;
  category: string;
  images: string[];
  rating: number;
  isNew?: boolean;
  isPopular?: boolean;
  disponible?: string;
}

export interface Category {
  name_search: string;
  name: string;
  name_ar: string;
  img_url: string;
}

export interface Slide {
  img: string;
  title: string;
  subtitle: string;
  cta: string;
  title_ar: string;
  subtitle_ar: string;
  cta_ar: string;
  link_url: string;
}

// Mock data for storefront fallbacks and local category navigation.
export const categories: Category[] = [
  { name_search: "tabaq-henna", name: "Plateau Henné", name_ar: "طبق الحنة", img_url: "/category_image2/tabaq-henna.png" },
  { name_search: "loouazem-khitba", name: "Accessoires Fiançailles", name_ar: "لوازم الخطوبة", img_url: "/category_image2/loouazem-khitba.png" },
  { name_search: "libas-takharuj", name: "Tenues Remise de Diplôme", name_ar: "لباس التخرج", img_url: "/category_image2/libas-takharuj.png" },
  { name_search: "qaada-henna", name: "Soirée Henné", name_ar: "قعدة الحنة", img_url: "/category_image2/qaada-henna.png" },
  { name_search: "qaada-loouazem", name: "Soirée Henné complète", name_ar: "قعدات الحنة بلوازمها", img_url: "/category_image2/qaada-loouazem.png" },
];

export const mockProducts: Product[] = [
  {
    id: "1",
    title: { fr: "Plateau de base", ar: "طبق الحنة الأساسي" },
    price: 2800,
    ancien_price: 3200,
    category: "tabaq-henna",
    images: ["/products/tabaq-henna-base.png"],
    rating: 4.8,
    isNew: true,
  },
  {
    id: "2",
    title: { fr: "Plateau complet avec bougies & ruban", ar: "طبق كامل بالشموع والشريط" },
    price: 5200,
    ancien_price: 5900,
    category: "tabaq-henna",
    images: ["/products/tabaq-henna-bougies-ruban.png"],
    rating: 4.9,
    isPopular: true,
  },
  {
    id: "3",
    title: { fr: "Plateau luxe avec ornements dorés", ar: "طبق فاخر بزخارف ذهبية" },
    price: 8800,
    ancien_price: 9800,
    category: "tabaq-henna",
    images: ["/products/tabaq-henna-luxe.png"],
    rating: 5,
    isPopular: true,
  },
  {
    id: "4",
    title: { fr: "Coffret alliance & bougie", ar: "علبة الخاتم والشمعة" },
    price: 3900,
    ancien_price: 0,
    category: "loouazem-khitba",
    images: ["/products/coffret-alliance-bougie.png"],
    rating: 4.7,
    isNew: true,
  },
  {
    id: "5",
    title: { fr: "Set décorations table", ar: "طقم تزيين الطاولة" },
    price: 4600,
    ancien_price: 5200,
    category: "loouazem-khitba",
    images: ["/products/set-decorations-table.png"],
    rating: 4.6,
  },
  {
    id: "6",
    title: { fr: "Pack complet fiançailles", ar: "باك كامل للخطوبة" },
    price: 12500,
    ancien_price: 14500,
    category: "loouazem-khitba",
    images: ["/products/pack-complet-fiancailles.png"],
    rating: 4.9,
    isPopular: true,
  },
  {
    id: "7",
    title: { fr: "Toge + chapeau", ar: "روب التخرج والقبعة" },
    price: 4200,
    ancien_price: 4800,
    category: "libas-takharuj",
    images: ["/products/toge-chapeau.png"],
    rating: 4.7,
    isNew: true,
  },
  {
    id: "8",
    title: { fr: "Ceinture & accessoires diplôme", ar: "حزام وإكسسوارات التخرج" },
    price: 2300,
    ancien_price: 0,
    category: "libas-takharuj",
    images: ["/products/ceinture-accessoires-diplome.png"],
    rating: 4.5,
  },
  {
    id: "9",
    title: { fr: "Décoration murale rideau pailleté", ar: "ستارة جدارية لامعة" },
    price: 6500,
    ancien_price: 7200,
    category: "qaada-henna",
    images: ["/products/rideau-paillete.png"],
    rating: 4.8,
    isPopular: true,
  },
  {
    id: "10",
    title: { fr: "Set bougies & lanternes", ar: "طقم الشموع والفوانيس" },
    price: 5400,
    ancien_price: 0,
    category: "qaada-henna",
    images: ["/products/bougies-lanternes.png"],
    rating: 4.9,
  },
  {
    id: "11",
    title: { fr: "Coussin sol & nappe traditionnelle", ar: "وسادة أرضية ومفرش تقليدي" },
    price: 6100,
    ancien_price: 6900,
    category: "qaada-henna",
    images: ["/products/coussin-nappe-traditionnelle.png"],
    rating: 4.6,
  },
  {
    id: "12",
    title: { fr: "Pack S - petit espace", ar: "باك S للمساحات الصغيرة" },
    price: 15500,
    ancien_price: 17500,
    category: "qaada-loouazem",
    images: ["/products/pack-s-henna.png"],
    rating: 4.8,
    isNew: true,
  },
  {
    id: "13",
    title: { fr: "Pack M - salon standard", ar: "باك M لصالون متوسط" },
    price: 23500,
    ancien_price: 26000,
    category: "qaada-loouazem",
    images: ["/products/pack-m-henna.png"],
    rating: 4.9,
    isPopular: true,
  },
  {
    id: "14",
    title: { fr: "Pack L - grande salle", ar: "باك L للقاعة الكبيرة" },
    price: 36000,
    ancien_price: 39500,
    category: "qaada-loouazem",
    images: ["/products/pack-l-henna.png"],
    rating: 5,
    isPopular: true,
  },
];
