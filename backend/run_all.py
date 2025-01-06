import subprocess
import sys
import os
import signal
import time
from threading import Thread

def run_server():
    """Run the FastAPI server"""
    print("Starting FastAPI server...")
    server_process = subprocess.Popen(
        [sys.executable, "run_server.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    return server_process

def run_agent():
    """Run the voice agent"""
    print("Starting voice agent...")
    agent_process = subprocess.Popen(
        "python agent.py dev",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        shell=True
    )
    return agent_process

def stream_output(process, prefix):
    """Stream process output with prefix"""
    for line in process.stdout:
        print(f"{prefix}: {line}", end='')
    for line in process.stderr:
        print(f"{prefix} ERROR: {line}", end='', file=sys.stderr)

def main():
    # Start FastAPI server
    server_process = run_server()
    server_thread = Thread(target=stream_output, args=(server_process, "Server"))
    server_thread.daemon = True
    server_thread.start()

    # Wait a bit for server to start
    time.sleep(2)

    # Start voice agent
    agent_process = run_agent()
    agent_thread = Thread(target=stream_output, args=(agent_process, "Agent"))
    agent_thread.daemon = True
    agent_thread.start()

    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
            # Check if either process has terminated
            if server_process.poll() is not None:
                print("Server process terminated unexpectedly")
                break
            if agent_process.poll() is not None:
                print("Agent process terminated unexpectedly")
                break
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        # Terminate both processes
        server_process.terminate()
        agent_process.terminate()
        try:
            server_process.wait(timeout=5)
            agent_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()
            agent_process.kill()

if __name__ == "__main__":
    main()
