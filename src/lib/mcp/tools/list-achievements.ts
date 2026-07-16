import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_achievements",
  title: "قائمة إنجازات المدرسة",
  description:
    "استعراض أحدث الإنجازات والمشاريع المنشورة مع العنوان والوصف والتاريخ والفئة.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("عدد الإنجازات المطلوبة (الافتراضي 10، بحد أقصى 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "غير مصرّح." }], isError: true };
    }
    const take = limit ?? 10;
    const { data, error } = await supabaseForUser(ctx)
      .from("achievements")
      .select("slug,title_ar,description_ar,achieved_on,academic_year,is_featured,is_pinned,status")
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("achieved_on", { ascending: false, nullsFirst: false })
      .limit(take);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { items: data ?? [] },
    };
  },
});
