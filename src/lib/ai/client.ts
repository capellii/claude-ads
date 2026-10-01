import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AI_MODEL = "claude-sonnet-4-6" as const;

export async function getSkillSystemPrompt(refs: string[] = []): Promise<string> {
  const { readSkillRef } = await import("./skill-loader");
  const skill = await readSkillRef("SKILL.md");
  const thinkingFramework = await readSkillRef("thinking-framework.md");
  const extra = await Promise.all(refs.map(readSkillRef));

  return [skill, thinkingFramework, ...extra.filter(Boolean)].join("\n\n---\n\n");
}
