import type { PaginationQuery } from "@base-mern/types";

export interface PaginateResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function paginate<T>(
  model: {
    findMany: (args: any) => Promise<T[]>;
    count: (args?: any) => Promise<number>;
  },
  query: PaginationQuery,
  options: {
    where?: any;
    select?: any;
    include?: any;
    orderBy?: any;
  } = {},
): Promise<PaginateResult<T>> {
  const { page = 1, limit = 10, sortBy, sortOrder = "desc" } = query;
  const { where, select, include } = options;

  const orderBy = options.orderBy ?? (sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder });

  const [data, total] = await Promise.all([
    model.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      ...(where ? { where } : {}),
      ...(select ? { select } : {}),
      ...(include ? { include } : {}),
    }),
    model.count(where ? { where } : {}),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
