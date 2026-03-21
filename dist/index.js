import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = new Server({ name: "smart-powershell", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "execute_powershell_safely",
                description: "Executes a PowerShell script securely with a strict timeout and deep error capture. Prevents terminal hangs and unexpected tool call drops by returning sanitized JSON output.",
                inputSchema: {
                    type: "object",
                    properties: {
                        script: { type: "string", description: "The raw PowerShell script string to execute." },
                        timeout_ms: { type: "number", description: "Optional timeout in milliseconds. Default is 15000 (15s)." }
                    },
                    required: ["script"],
                },
            }
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "execute_powershell_safely") {
        const args = request.params.arguments;
        const script = args.script;
        const timeout = args.timeout_ms || 15000;
        // Create a temporary script file to bypass escaping/quoting issues via CLI
        const tempFile = path.join(__dirname, `temp_${crypto.randomBytes(4).toString('hex')}.ps1`);
        fs.writeFileSync(tempFile, script);
        return new Promise((resolve) => {
            const proc = spawn("powershell.exe", [
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy", "Bypass",
                "-File", tempFile
            ]);
            let stdout = "";
            let stderr = "";
            proc.stdout.on("data", (data) => stdout += data.toString());
            proc.stderr.on("data", (data) => stderr += data.toString());
            const timer = setTimeout(() => {
                proc.kill();
                if (fs.existsSync(tempFile))
                    fs.unlinkSync(tempFile);
                const result = {
                    status: "timeout",
                    exit_code: null,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    message: `Process killed after exceeding ${timeout}ms timeout. This safety net prevented the session from hanging.`
                };
                resolve({
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
                });
            }, timeout);
            proc.on("close", (code) => {
                clearTimeout(timer);
                if (fs.existsSync(tempFile))
                    fs.unlinkSync(tempFile);
                const result = {
                    status: code === 0 ? "success" : "error",
                    exit_code: code,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    message: code === 0 ? "Execution completed successfully." : "Execution finished with errors."
                };
                resolve({
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
                });
            });
        });
    }
    throw new Error(`Tool not found: ${request.params.name}`);
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
