import { Router, type IRouter } from "express";
import healthRouter from "./health";
import urlsRouter from "./urls";
import analyticsRouter from "./analytics";
import redirectRouter from "./redirect";

const router: IRouter = Router();

router.use(healthRouter);
router.use(urlsRouter);
router.use(analyticsRouter);
router.use(redirectRouter);

export default router;
