import product1 from "@/assets/products/product-1.jpeg";
import product2 from "@/assets/products/product-2.jpeg";
import product3 from "@/assets/products/product-3.jpeg";
import product4 from "@/assets/products/product-4.jpeg";
import product5 from "@/assets/products/product-5.jpeg";
import product6 from "@/assets/products/product-6.jpeg";
import product7 from "@/assets/products/product-7.jpeg";

import { Product, Category } from "@/types/product";

export const products: Product[] = [
  {
    id: "1",
    name: "صحون تقديم مضفورة",
    description: "صحون تقديم أنيقة مصنوعة يدوياً من مادة الحلقة، مثالية للمناسبات",
    price: 2500,
    originalPrice: 3000,
    image: product1,
    category: "صحون",
    inStock: true,
    rating: 4.8,
    reviewCount: 24,
  },
  {
    id: "2",
    name: "سلة قلب ديكور",
    description: "سلة بشكل قلب جميل للديكور، صناعة حرفية تقليدية",
    price: 1800,
    image: product2,
    category: "ديكور",
    inStock: true,
    rating: 4.9,
    reviewCount: 18,
  },
  {
    id: "3",
    name: "سلة دائرية كلاسيكية",
    description: "سلة دائرية متعددة الاستخدامات، تصميم كلاسيكي أنيق",
    price: 2200,
    image: product3,
    category: "سلال",
    inStock: true,
    rating: 4.7,
    reviewCount: 32,
  },
  {
    id: "4",
    name: "سلة غسيل كبيرة",
    description: "سلة غسيل واسعة بتصميم مخطط، متينة وعملية",
    price: 4500,
    originalPrice: 5200,
    image: product4,
    category: "سلال",
    inStock: true,
    rating: 4.6,
    reviewCount: 15,
  },
  {
    id: "5",
    name: "صندوق تخزين مزخرف",
    description: "صندوق أنيق بغطاء لحفظ الأغراض الثمينة",
    price: 3800,
    image: product5,
    category: "صناديق",
    inStock: true,
    rating: 4.9,
    reviewCount: 28,
  },
  {
    id: "6",
    name: "حقيبة يد حرفية",
    description: "حقيبة يد أنيقة بتصميم عصري ومقابض مريحة",
    price: 5500,
    originalPrice: 6500,
    image: product6,
    category: "حقائب",
    inStock: true,
    rating: 4.8,
    reviewCount: 42,
  },
  {
    id: "7",
    name: "سلة بيكنيك بغطاء",
    description: "سلة مثالية للنزهات مع غطاء ومقابض قوية",
    price: 4200,
    image: product7,
    category: "سلال",
    inStock: false,
    rating: 4.7,
    reviewCount: 21,
  },
];

export const categories: Category[] = [
  { id: "1", name: "سلال", icon: "🧺", productCount: 12 },
  { id: "2", name: "صحون", icon: "🍽️", productCount: 8 },
  { id: "3", name: "حقائب", icon: "👜", productCount: 6 },
  { id: "4", name: "صناديق", icon: "📦", productCount: 10 },
  { id: "5", name: "ديكور", icon: "🏠", productCount: 15 },
  { id: "6", name: "مستلزمات", icon: "🛠️", productCount: 20 },
];
