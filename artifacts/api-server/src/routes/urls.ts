import { Router, type IRouter } from "express";
import { eq, and, desc, ilike, count, sql } from "drizzle-orm";
import { db, urlsTable, clicksTable } from "@workspace/db";
import {
  ListUrlsQueryParams,
  CreateUrlBody,
  GetUrlParams,
  UpdateUrlParams,
  UpdateUrlBody,
  DeleteUrlParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { generateShortCode } from "../lib/shortCode";

const router: IRouter = Router();

router.get("/urls/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const [totals] = await db
    .select({
      totalUrls: count(urlsTable.id),
      totalClicks: sql<number>`sum(${urlsTable.totalClicks})`.mapWith(Number),
      activeUrls: sql<number>`sum(case when ${urlsTable.isActive} then 1 else 0 end)`.mapWith(Number),
    })
    .from(urlsTable)
    .where(eq(urlsTable.userId, userId));

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [weekClicks] = await db
    .select({ clicksThisWeek: count(clicksTable.id) })
    .from(clicksTable)
    .innerJoin(urlsTable, eq(clicksTable.urlId, urlsTable.id))
    .where(
      and(
        eq(urlsTable.userId, userId),
        sql`${clicksTable.createdAt} >= ${oneWeekAgo}`,
      ),
    );

  const [topUrl] = await db
    .select()
    .from(urlsTable)
    .where(eq(urlsTable.userId, userId))
    .orderBy(desc(urlsTable.totalClicks))
    .limit(1);

  res.json({
    totalUrls: totals?.totalUrls ?? 0,
    totalClicks: totals?.totalClicks ?? 0,
    activeUrls: totals?.activeUrls ?? 0,
    clicksThisWeek: weekClicks?.clicksThisWeek ?? 0,
    topUrl: topUrl ?? null,
  });
});

router.get("/urls/public/:shortCode", async (req, res): Promise<void> => {
  const shortCode = Array.isArray(req.params.shortCode)
    ? req.params.shortCode[0]
    : req.params.shortCode;

  const [url] = await db
    .select()
    .from(urlsTable)
    .where(eq(urlsTable.shortCode, shortCode))
    .limit(1);

  if (!url) {
    res.status(404).json({ error: "Short URL not found" });
    return;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyRows = await db
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

  res.json({
    shortCode: url.shortCode,
    title: url.title,
    totalClicks: url.totalClicks,
    createdAt: url.createdAt,
    dailyClicks: dailyRows,
  });
});

router.get("/urls", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const parsed = ListUrlsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page, limit, search } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(urlsTable.userId, userId)];
  if (search) {
    conditions.push(
      sql`(${ilike(urlsTable.originalUrl, `%${search}%`)} OR ${ilike(urlsTable.title, `%${search}%`)} OR ${ilike(urlsTable.shortCode, `%${search}%`)})`,
    );
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ total: count(urlsTable.id) })
    .from(urlsTable)
    .where(where);

  const urls = await db
    .select()
    .from(urlsTable)
    .where(where)
    .orderBy(desc(urlsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    urls,
    total: totalResult?.total ?? 0,
    page,
    limit,
  });
});

router.post("/urls", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const parsed = CreateUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { originalUrl, customAlias, title, expiresAt } = parsed.data;

  if (customAlias) {
    const [existing] = await db
      .select({ id: urlsTable.id })
      .from(urlsTable)
      .where(eq(urlsTable.shortCode, customAlias))
      .limit(1);
    if (existing) {
      res.status(400).json({ error: "Custom alias already taken" });
      return;
    }
  }

  let shortCode = customAlias;
  if (!shortCode) {
    let unique = false;
    while (!unique) {
      shortCode = generateShortCode();
      const [existing] = await db
        .select({ id: urlsTable.id })
        .from(urlsTable)
        .where(eq(urlsTable.shortCode, shortCode))
        .limit(1);
      if (!existing) unique = true;
    }
  }

  const [url] = await db
    .insert(urlsTable)
    .values({
      userId,
      originalUrl,
      shortCode: shortCode!,
      customAlias: customAlias ?? null,
      title: title ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  res.status(201).json(url);
});

router.get("/urls/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const params = GetUrlParams.safeParse(req.params);
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

  res.json(url);
});

router.put("/urls/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const params = UpdateUrlParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.originalUrl != null) updateData.originalUrl = parsed.data.originalUrl;
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.customAlias != null) updateData.customAlias = parsed.data.customAlias;
  if (parsed.data.expiresAt != null) updateData.expiresAt = new Date(parsed.data.expiresAt);
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;

  const [url] = await db
    .update(urlsTable)
    .set(updateData)
    .where(and(eq(urlsTable.id, params.data.id), eq(urlsTable.userId, userId)))
    .returning();

  if (!url) {
    res.status(404).json({ error: "URL not found" });
    return;
  }

  res.json(url);
});

router.delete("/urls/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const params = DeleteUrlParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(urlsTable)
    .where(and(eq(urlsTable.id, params.data.id), eq(urlsTable.userId, userId)))
    .returning({ id: urlsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "URL not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
