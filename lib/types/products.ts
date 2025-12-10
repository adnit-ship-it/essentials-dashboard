export type ProductCategory =
  | "weight-loss"
  | "sexual health"
  | "wellness"
  | "hair"
  | "skin";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  img: string;
  thumbnail: string;
  prices: {
    monthly?: number;
    threeMonthly?: number;
    sixMonthly?: number;
  };
  productBundleIds: {
    monthly?: string;
    threeMonthly?: string;
    sixMonthly?: string;
  };
  popular?: boolean;
  availability?: "in_stock" | "out_of_stock" | "coming_soon";
  features?: string[];
  quiz?: string | null;
  type?: "injection" | "oral_drops" | "oral_pills";
  order?: number;
}

