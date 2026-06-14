import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, urlsTable, clicksTable } from "@workspace/db";
import { ResolveShortCodeParams } from "@workspace/api-zod";
import { parseUserAgent } from "../lib/userAgent";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/redirect/:shortCode", async (req, res): Promise<void> => {
  const params = ResolveShortCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid short code" });
    return;
  }

  const [url] = await db
    .select()
    .from(urlsTable)
    .where(eq(urlsTable.shortCode, params.data.shortCode))
    .limit(1);

  if (!url) {
    res.status(404).json({ error: "Short URL not found" });
    return;
  }

  if (!url.isActive) {
    res.status(410).json({ error: "This link is no longer active" });
    return;
  }

  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    res.status(410).json({ error: "This link has expired" });
    return;
  }

  const ua = req.headers["user-agent"];
  const { deviceType, browser, os } = parseUserAgent(ua);
  const referrer = req.headers["referer"] ?? req.headers["referrer"] ?? null;
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? null;

  await db.insert(clicksTable).values({
    urlId: url.id,
    deviceType,
    browser,
    os,
    country: null,
    city: null,
    referrer: typeof referrer === "string" ? referrer : null,
    ipAddress,
  });

  await db
    .update(urlsTable)
    .set({
      totalClicks: sql`${urlsTable.totalClicks} + 1`,
      lastVisitedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(urlsTable.id, url.id));

  res.json({
    originalUrl: url.originalUrl,
    title: url.title,
  });
});

export default router;
