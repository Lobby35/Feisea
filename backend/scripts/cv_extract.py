import json
import re
import resource
import subprocess
import sys

resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
resource.setrlimit(resource.RLIMIT_CPU, (8, 8))

result = subprocess.run(
    ["pdftotext", "-f", "1", "-l", "10", "-layout", "-enc", "UTF-8", sys.argv[1], "-"],
    capture_output=True, timeout=9, check=True,
)
text = result.stdout.decode("utf-8", errors="replace")[:200000]
if not text.strip():
    raise SystemExit(1)

suggestions = {}
patterns = {
    "email": r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
    "phone": r"(?<!\w)(?:\+\d{1,3}[ .-]?)?(?:\d[ .-]?){8,13}\d(?!\w)",
    "linkedin": r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_%/-]+",
    "github": r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_-]+",
}
for field, pattern in patterns.items():
    match = re.search(pattern, text, re.I)
    if match:
        value = match.group().strip()
        if field in ("linkedin", "github") and not value.startswith(("https://", "http://")):
            value = "https://" + value
        suggestions[field] = value

lines = [line.strip() for line in text.splitlines() if line.strip()]
for line in lines[:4]:
    if re.fullmatch(r"[^\W\d_]+(?:[ '-][^\W\d_]+){1,5}", line, re.UNICODE) and not re.search(r"curr[ií]cul|resume|vitae|profile|perfil", line, re.I):
        suggestions["name"] = line[:150]
        break

print(json.dumps({"suggestions": suggestions, "message": "Review these suggestions before applying them. Scanned PDFs require OCR."}))
