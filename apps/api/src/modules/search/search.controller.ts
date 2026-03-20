import { Request, Response, NextFunction } from "express";
import { searchService } from "./search.service.js";

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, index, page, limit } = req.query as {
      q: string;
      index: string;
      page: string;
      limit: string;
    };
    const result = await searchService.search(q, index, Number(page) || 1, Number(limit) || 10);
    res.json({
      success: true,
      data: result.hits,
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 10)),
      },
    });
  } catch (error) {
    next(error);
  }
}
