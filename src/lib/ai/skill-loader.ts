import fs from "fs/promises";
import path from "path";

const SKILL_REFS_DIR = path.join(process.cwd(), "skill-refs");

// Reads a skill reference file from skill-refs/
// Returns empty string if not found (allows graceful degradation)
export async function readSkillRef(filename: string): Promise<string> {
  try {
    const filePath = path.join(SKILL_REFS_DIR, filename);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    console.warn(`[skill-loader] skill-refs/${filename} not found — skipping`);
    return "";
  }
}
