import fs from "fs"
import path from "path"
import process from "process"

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

const url = process.argv[2] ?? "http://127.0.0.1:3100"
const outputName = process.argv[3] ?? "home-snapshot.txt"
const OUTPUT_DIR = path.resolve("analysis")
const SNAPSHOT_FILE = path.join(OUTPUT_DIR, outputName)

async function captureSnapshot() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["@playwright/mcp", "--headless", "--viewport-size", "1280x720"],
    env: { ...process.env },
    stderr: "inherit"
  })

  const client = new Client({
    name: "playwright-analysis",
    version: "1.0.0"
  })

  await client.connect(transport)

  try {
    await client.callTool({
      name: "browser_navigate",
      arguments: { url }
    })

    const snapshotResult = await client.callTool({
      name: "browser_snapshot",
      arguments: {}
    })

    const snapshotContent = snapshotResult.content
      ?.map(entry => (entry.type === "text" ? entry.text : JSON.stringify(entry, null, 2)))
      .join("\n\n") ?? ""

    fs.writeFileSync(SNAPSHOT_FILE, snapshotContent, "utf-8")

    console.log(`Snapshot written to ${SNAPSHOT_FILE}`)
  } finally {
    await client.close()
    await transport.close()
  }
}

captureSnapshot().catch(error => {
  console.error("Playwright capture failed:", error)
  process.exitCode = 1
})
