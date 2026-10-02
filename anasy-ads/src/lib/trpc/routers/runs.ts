import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { runs } from "@/lib/db/schema";
import { enqueueWorkflow } from "@/lib/queue/client";

const runTypeSchema = z.enum(["setup", "audit", "plan", "report"]);

export const runsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        type: runTypeSchema,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [run] = await ctx.db
        .insert(runs)
        .values({ tenantId: ctx.tenantId, type: input.type, status: "queued" })
        .returning();

      await enqueueWorkflow({
        runId: run.id,
        tenantId: ctx.tenantId,
        type: input.type,
        payload: input.notes ? { notes: input.notes } : {},
      });

      return run;
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(runs)
        .where(eq(runs.tenantId, ctx.tenantId))
        .orderBy(desc(runs.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [run] = await ctx.db
        .select()
        .from(runs)
        .where(and(eq(runs.id, input.id), eq(runs.tenantId, ctx.tenantId)));

      if (!run) throw new TRPCError({ code: "NOT_FOUND" });
      return run;
    }),
});
