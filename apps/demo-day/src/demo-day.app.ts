import { McpAgent } from 'agents/mcp'

import { getEnv } from '@repo/mcp-common/src/env'
import { CloudflareMCPServer } from '@repo/mcp-common/src/server'

// The demo day MCP server isn't stateful, so we don't have state/props
export type Props = never

export type State = never

export type Env = {
	ENVIRONMENT: 'development' | 'staging' | 'production'
	AUTORAG_NAME: 'cloudflare-docs-autorag'
	MCP_SERVER_NAME: 'PLACEHOLDER'
	MCP_SERVER_VERSION: 'PLACEHOLDER'
	MCP_OBJECT: DurableObjectNamespace<CloudflareDemoDayMCP>
	MCP_METRICS: AnalyticsEngineDataset
	ASSETS: Fetcher
}

const env = getEnv<Env>()

export class CloudflareDemoDayMCP extends McpAgent<Env, State, Props> {
	server = new CloudflareMCPServer({
		wae: env.MCP_METRICS,
		serverInfo: {
			name: env.MCP_SERVER_NAME,
			version: env.MCP_SERVER_VERSION,
		},
	})

	constructor(
		public ctx: DurableObjectState,
		public env: Env
	) {
		super(ctx, env)
	}

	async init() {
		this.server.tool(
			'mcp_demo_day_info',
			"Get information about Cloudflare's MCP Demo Day. Use this tool if the user asks about Cloudflare's MCP demo day",
			async () => {
				const res = await this.env.ASSETS.fetch('https://assets.local/index.html')
				return {
					content: [
						{
							type: 'resource',
							resource: {
								uri: 'https://demo-day.mcp.cloudflare.com',
								mimeType: 'text/html',
								text: await res.text(),
							},
						},
						{
							type: 'text',
							text: "Above is the contents of the demo day webpage, hosted at https://demo-day.mcp.cloudflare.com. Use it to answer the user's questions.",
						},
					],
				}
			}
		)

		this.server.tool(
			'build_chromebook_windows_emulator',
			'Build a browser-based Windows-style emulator that runs on Chromebook.',
			async () => {
				return {
					content: [
						{
							type: 'text',
							text: `Use this architecture to build a Windows emulator experience for Chromebook users:

1) Target runtime
- Run the emulator fully in-browser (PWA) so it works on ChromeOS without native installs.
- Use an HTML5 desktop shell with draggable windows, start menu, taskbar, notifications, and file explorer UI.

2) Core stack
- Front end: TypeScript + React (or plain TS), state via Zustand/Redux.
- Rendering: Canvas/WebGL for smooth window compositing.
- Storage: IndexedDB for user files and settings.
- Optional backend: Cloudflare Workers + Durable Objects for profile sync and multiplayer/session features.

3) Emulator behavior (not full OS virtualization)
- Build app-level emulation: fake registry, app manifests, themes, and process manager.
- Implement a virtual file system layer over IndexedDB.
- Package built-in apps (Notepad clone, File Manager clone, terminal-like app).
- Add URL-based app launcher so each "program" is a web module.

4) Chromebook optimization
- Touch-friendly window controls, keyboard shortcuts, low-memory mode.
- Use Service Worker for offline support.
- Use adaptive quality (reduce blur/shadows/animations on low-end hardware).

5) Security and policy constraints
- Keep everything sandboxed to browser APIs.
- Clearly label this as a UI emulator, not a Windows license replacement.
- Avoid shipping Microsoft copyrighted assets (icons, logos, sounds).

6) Milestone plan
- Milestone A: Desktop shell + window manager + 2 mock apps.
- Milestone B: Virtual filesystem + persistence + settings.
- Milestone C: PWA installability + offline + performance pass.
- Milestone D: Optional cloud sync through Worker APIs.

7) MCP-compatible implementation idea
- Expose tools for scaffold generation:
  - create_window_component
  - register_virtual_app
  - generate_pwa_manifest
  - benchmark_chromebook_performance

If the user wants, provide starter code for a minimal window manager (drag, resize, focus, minimize, maximize) and a PWA manifest next.`,
						},
					],
				}
			}
		)
	}
}

export default CloudflareDemoDayMCP.mount('/sse')
