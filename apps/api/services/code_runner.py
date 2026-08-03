import asyncio
import tempfile
import os
import re
import time


async def run_code(code: str, language: str, stdin: str = "") -> dict:
    lang = language.lower()
    start = time.time()

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            if lang == "python":
                filepath = os.path.join(tmpdir, "solution.py")
                with open(filepath, "w") as f:
                    f.write(code)
                cmd = ["python", filepath]

            elif lang == "javascript":
                filepath = os.path.join(tmpdir, "solution.js")
                with open(filepath, "w") as f:
                    f.write(code)
                cmd = ["node", filepath]

            elif lang == "cpp":
                filepath = os.path.join(tmpdir, "solution.cpp")
                exec_path = os.path.join(tmpdir, "solution")
                with open(filepath, "w") as f:
                    f.write(code)
                compile_proc = await asyncio.create_subprocess_exec(
                    "g++", "-o", exec_path, filepath,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                _, cerr = await asyncio.wait_for(compile_proc.communicate(), timeout=15.0)
                if compile_proc.returncode != 0:
                    return {
                        "stdout": "",
                        "stderr": f"Compilation error:\n{cerr.decode('utf-8', errors='replace')}",
                        "exit_code": compile_proc.returncode,
                        "execution_time": round(time.time() - start, 3),
                    }
                cmd = [exec_path]

            elif lang == "java":
                match = re.search(r'public\s+class\s+(\w+)', code)
                class_name = match.group(1) if match else "Solution"
                filepath = os.path.join(tmpdir, f"{class_name}.java")
                with open(filepath, "w") as f:
                    f.write(code)
                compile_proc = await asyncio.create_subprocess_exec(
                    "javac", filepath,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=tmpdir,
                )
                _, cerr = await asyncio.wait_for(compile_proc.communicate(), timeout=15.0)
                if compile_proc.returncode != 0:
                    return {
                        "stdout": "",
                        "stderr": f"Compilation error:\n{cerr.decode('utf-8', errors='replace')}",
                        "exit_code": compile_proc.returncode,
                        "execution_time": round(time.time() - start, 3),
                    }
                cmd = ["java", "-cp", tmpdir, class_name]

            else:
                return {
                    "stdout": "", "stderr": f"Unsupported language: {language}",
                    "exit_code": 1, "execution_time": 0,
                }

            proc = await asyncio.wait_for(
                asyncio.create_subprocess_exec(
                    *cmd,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=tmpdir,
                ),
                timeout=10.0,
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(input=stdin.encode() if stdin else b""),
                timeout=10.0,
            )
            return {
                "stdout": stdout.decode("utf-8", errors="replace")[:4096],
                "stderr": stderr.decode("utf-8", errors="replace")[:2048],
                "exit_code": proc.returncode,
                "execution_time": round(time.time() - start, 3),
            }

        except asyncio.TimeoutError:
            return {"stdout": "", "stderr": "Execution timed out (10s limit)", "exit_code": 124, "execution_time": 10.0}
        except Exception as e:
            return {"stdout": "", "stderr": str(e), "exit_code": 1, "execution_time": round(time.time() - start, 3)}
