import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { accounts } from "@/lib/db/schema";
import { deleteSecret } from "@/lib/vault";

export const accountsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.tenantId, ctx.tenantId), eq(accounts.isActive, true)));
  }),

  disconnect: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [account] = await ctx.db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.tenantId, ctx.tenantId)));

      if (!account) throw new TRPCError({ code: "NOT_FOUND" });

      await deleteSecret(account.secretRef);
      await ctx.db
        .update(accounts)
        .set({ isActive: false })
        .where(eq(accounts.id, input.id));
    }),
});
