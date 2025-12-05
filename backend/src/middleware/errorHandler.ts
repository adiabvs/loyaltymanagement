import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Error:", err);

  if (err.message.includes("not found")) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err.message.includes("already exists") || err.message.includes("duplicate")) {
    res.status(409).json({ error: err.message });
    return;
  }

  if (err.message.includes("Invalid") || err.message.includes("invalid")) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

