import { spawn } from "child_process"
import { setTimeout as sleep } from "timers/promises"
import fs from "fs"
import path from "path"
import process from "process"

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

const NEXT_PORT = 30001
const NEXT_URL = `http://127.0.0.1:${NEXT_PORT}`
const OUTPUT_DIR = path.resolve("analysis")
const SNAPSHOT_FILE = path.join(OUTPUT_DIR, "home-snapshot.txt")

function startDevServer() {
  const server = spawn("pnpm", ["--filter", "web", "dev"], {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: "inherit"
  })
  return server
}

async function waitForServer(url, { timeoutMs = 60000, intervalMs = 1000 } = {}) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" })
      if (response.ok || response.status === 404) {
        return true
      }
    } catch (error) {
      // Server not ready yet
    }
    await sleep(intervalMs)
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}

async function captureHomeSnapshot() {
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
      arguments: { url: NEXT_URL }
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

async function main() {
  const server = startDevServer()

  try {
    await waitForServer(NEXT_URL)
    await captureHomeSnapshot()
  } finally {
    server.kill("SIGINT")
  }
}

main().catch(error => {
  console.error("Playwright inspection failed:", error)
  process.exitCode = 1
})
