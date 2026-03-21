# Smart PowerShell (GEMINI.md)

## Purpose
This MCP server provides a robust and secure way to execute PowerShell scripts by including mandatory timeouts and comprehensive error capture.

## Usage for Agents
- Use `execute_powershell_safely` for any PowerShell command that might take time or fail unexpectedly.
- This tool avoids session hangs and provides a sanitized JSON report of the execution results.
- **Safety First**: It handles script execution via temporary files to bypass complex CLI escaping issues.

## Error Handling
- Capture both `stdout` and `stderr`.
- Provides an explicit `timeout` mechanism (default 15s) to prevent blocking the agent loop.
