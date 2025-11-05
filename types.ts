
export interface AdContent {
  title: string;
  description: string;
  tags: string[];
  imageUrls: string[];
}

export enum AppStatus {
  Idle,
  Extracting,
  Optimizing,
  Success,
  Error,
}
