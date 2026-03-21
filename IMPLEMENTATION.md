# IMPLEMENTATION: Smart PowerShell

## Overview
A secure execution server that uses temporary scripts to run PowerShell via Node.js's `spawn`.

## Tools (Methods)

### 1. `execute_powershell_safely`
**Description**: Executes a script with a timeout and deep error capture.
- **Parameters**:
  - `script` (string): The raw PowerShell script.
  - `timeout_ms` (number, optional, default: 15000): Timeout in milliseconds.
- **Returns**: A JSON string with `status`, `exit_code`, `stdout`, `stderr`, and `message`.

## Execution Process
- **Temporary File Creation**: Writes the script to a unique `.ps1` file in the project directory.
- **Spawn Process**: Executes `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File <temp_file>`.
- **Timeout Monitoring**: Kills the process if it exceeds the specified time.
- **Cleanup**: Automatically deletes the temporary script file after execution or timeout.
