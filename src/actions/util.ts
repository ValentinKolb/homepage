import { z } from "astro:schema";

export type Paginated<T> = {
  data: T[];
  total: number;
  perPage: number;
  page: number;
};

export const PaginationSchema = z
  .object({
    perPage: z.number().min(1).max(100).default(10),
    page: z.number().min(1).default(1),
  })
  .transform((v) => ({
    ...v,
    offset: (v.page - 1) * v.perPage,
  }));
