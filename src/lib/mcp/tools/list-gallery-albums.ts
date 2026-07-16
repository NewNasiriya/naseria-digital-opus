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
  name: "list_gallery_albums",
  title: "قائمة ألبومات معرض الصور",
  description:
    "استعراض أحدث ألبومات الصور المنشورة مع العنوان والوصف والتصنيف وعدد الصور.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("عدد الألبومات المطلوبة (الافتراضي 10، بحد أقصى 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "غير مصرّح." }], isError: true };
    }
    const take = limit ?? 10;
    const { data, error } = await supabaseForUser(ctx)
      .from("gallery_albums")
      .select("slug,title_ar,description_ar,category,status,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
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
