export interface Specification {
  key: string;
  value: string;
}

export interface AdContent {
  title: string;
  description: string;
  tags: string[];
  imageUrls: string[];
  brand?: string;
  price?: string;
  category?: string;
  specifications?: Specification[];
  condition?: string;
  sku?: string;
  availability?: string;
}

export enum AppStatus {
  Idle,
  Extracting,
  Optimizing,
  Success,
  Error,
}