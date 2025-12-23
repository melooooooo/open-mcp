
async function verifyMetadata() {
  const slug = encodeURIComponent('网联清算待遇大曝光');
  // Port 30001
  const potentialPorts = [30001];

  for (const port of potentialPorts) {
    const url = `http://localhost:${port}/experiences/${slug}`;
    console.log(`Checking URL: ${url}`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`Failed to fetch from port ${port}: ${res.status}`);
        continue;
      }

      const html = await res.text();

      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const descMatch = html.match(/<meta name="description" content="([^"]+)"/);

      const title = titleMatch ? titleMatch[1] : null;
      const description = descMatch ? descMatch[1] : null;

      console.log(`\n--- Results for port ${port} ---`);
      console.log(`Page Title: "${title}"`);
      console.log(`Description length: ${description ? description.length : 0}`);

      if (title === "网联清算待遇大曝光") {
        console.log("✅ Title verification PASSED");
        return;
      } else {
        console.log("❌ Title verification FAILED");
      }
    } catch (err) {
      console.log(`Error checking port ${port}: ${err.message}`);
    }
  }
}

verifyMetadata();
