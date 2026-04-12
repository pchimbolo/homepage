export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { content } = req.body;

  if (typeof content !== "string") {
    return res.status(400).json({ error: "Content must be a string" });
  }

  const { parse } = await import("yaml");
  try {
    const parsed = parse(content);
    return res.status(200).json({ valid: true, parsed });
  } catch (parseError) {
    return res.status(200).json({
      valid: false,
      error: parseError.message,
      line: parseError.linePos?.[0]?.line,
      col: parseError.linePos?.[0]?.col,
    });
  }
}
