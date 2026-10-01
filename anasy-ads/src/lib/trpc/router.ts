import { router } from "./init";
import { accountsRouter } from "./routers/accounts";
import { runsRouter } from "./routers/runs";

export const appRouter = router({
  accounts: accountsRouter,
  runs: runsRouter,
});

export type AppRouter = typeof appRouter;
