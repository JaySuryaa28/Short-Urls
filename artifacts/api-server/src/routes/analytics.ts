import { Router, type IRouter } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { db, urlsTable, clicksTable } from "@workspace/db";
import {
  GetAnalyticsParams,
  GetDailyClicksParams,
  GetAnalyticsBreakdownParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/analytics/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const params = GetAnalyticsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [url] = await db
    .select()
    .from(urlsTable)
    .where(and(eq(urlsTable.id, params.data.id), eq(urlsTable.userId, userId)));

  if (!url) {
    res.status(404).json({ error: "URL not found" });
    return;
  }

  const [uniqueResult] = await db
    .select({ uniqueClicks: sql<number>`count(distinct ${clicksTable.ipAddress})`.mapWith(Number) })
    .from(clicksTable)
    .where(eq(clicksTable.urlId, url.id));

  const recentClicks = await db
    .select()
    .from(clicksTable)
    .where(eq(clicksTable.urlId, url.id))
    .orderBy(sql`${clicksTable.createdAt} desc`)
    .limit(20);

  res.json({
    urlId: url.id,
    shortCode: url.shortCode,
    originalUrl: url.originalUrl,
    totalClicks: url.totalClicks,
    uniqueClicks: uniqueResult?.uniqueClicks ?? 0,
    lastVisitedAt: url.lastVisitedAt,
    recentClicks,
  });
});

router.get("/analytics/:id/daily", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const params = GetDailyClicksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [url] = await db
    .select({ id: urlsTable.id })
    .from(urlsTable)
    .where(and(eq(urlsTable.id, params.data.id), eq(urlsTable.userId, userId)));

  if (!url) {
    res.status(404).json({ error: "URL not found" });
    return;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${clicksTable.createdAt})::date::text`,
      clicks: count(clicksTable.id),
    })
    .from(clicksTable)
    .where(
      and(
        eq(clicksTable.urlId, url.id),
        sql`${clicksTable.createdAt} >= ${thirtyDaysAgo}`,
      ),
    )
    .groupBy(sql`date_trunc('day', ${clicksTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${clicksTable.createdAt})`);

  res.json(rows);
});

router.get("/analytics/:id/breakdown", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const params = GetAnalyticsBreakdownParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [url] = await db
    .select({ id: urlsTable.id })
    .from(urlsTable)
    .where(and(eq(urlsTable.id, params.data.id), eq(urlsTable.userId, userId)));

  if (!url) {
    res.status(404).json({ error: "URL not found" });
    return;
  }

  async function getBreakdown(field: typeof clicksTable.deviceType | typeof clicksTable.browser | typeof clicksTable.os | typeof clicksTable.country) {
    const rows = await db
      .select({
        label: field,
        count: count(clicksTable.id),
      })
      .from(clicksTable)
      .where(eq(clicksTable.urlId, url!.id))
      .groupBy(field)
      .orderBy(sql`count(${clicksTable.id}) desc`)
      .limit(10);

    const total = rows.reduce((s, r) => s + r.count, 0);
    return rows.map((r) => ({
      label: r.label ?? "Unknown",
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));
  }

  const [devices, browsers, os, countries] = await Promise.all([
    getBreakdown(clicksTable.deviceType),
    getBreakdown(clicksTable.browser),
    getBreakdown(clicksTable.os),
    getBreakdown(clicksTable.country),
  ]);

  res.json({ devices, browsers, os, countries });
});

export default router;
