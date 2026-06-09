"""
run_tests.py — Runner de testes para o Axis Working API
========================================================

Uso:
    python run_tests.py              # unit + integration
    python run_tests.py --unit       # apenas unit tests
    python run_tests.py --all        # unit + integration + load
    python run_tests.py --load       # apenas load test

A API deve estar rodando em http://127.0.0.1:8001 para os testes de
integracao e de carga. Os unit tests nao precisam da API.

Variaveis de ambiente:
    AXIS_API_BASE_URL   URL base da API (padrao: http://127.0.0.1:8001)
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
TESTS_DIR = BASE_DIR / "tests"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def banner(text: str) -> None:
    line = "─" * (len(text) + 4)
    print(f"\n{BOLD}{line}{RESET}")
    print(f"{BOLD}  {text}{RESET}")
    print(f"{BOLD}{line}{RESET}")


def run(label: str, cmd: list[str]) -> tuple[int, float]:
    banner(label)
    started = time.perf_counter()
    result = subprocess.run(cmd, cwd=BASE_DIR)
    elapsed = time.perf_counter() - started
    status = f"{GREEN}PASSOU{RESET}" if result.returncode == 0 else f"{RED}FALHOU{RESET}"
    print(f"\n{BOLD}{label}:{RESET} {status}  ({elapsed:.1f}s)")
    return result.returncode, elapsed


def main() -> None:
    parser = argparse.ArgumentParser(description="Runner de testes do Axis Working API")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--unit", action="store_true", help="Apenas unit tests")
    group.add_argument("--all", action="store_true", help="Unit + integration + load")
    group.add_argument("--load", action="store_true", help="Apenas load test")
    args = parser.parse_args()

    py = sys.executable
    results: list[tuple[str, int]] = []

    # ── Unit tests ─────────────────────────────────────────────────
    if not args.load:
        code, _ = run(
            "Unit Tests  (sem banco de dados)",
            [py, "-m", "unittest", "tests/test_unit_core.py", "-v"],
        )
        results.append(("Unit Tests", code))

    # ── Integration tests ──────────────────────────────────────────
    if not args.unit and not args.load:
        code, _ = run(
            "Integration Tests  (requer API em execucao)",
            [py, "-m", "unittest", "tests/test_integration_api.py", "-v"],
        )
        results.append(("Integration Tests", code))

    # ── Load test ──────────────────────────────────────────────────
    if args.all or args.load:
        code, _ = run(
            "Load Test  (20 usuarios / 200 requisicoes)",
            [py, "tests/load_test_api.py", "--users", "20", "--requests", "200"],
        )
        results.append(("Load Test", code))

    # ── Resumo ─────────────────────────────────────────────────────
    banner("Resumo")
    all_passed = True
    for label, code in results:
        icon = f"{GREEN}✓{RESET}" if code == 0 else f"{RED}✗{RESET}"
        print(f"  {icon}  {label}")
        if code != 0:
            all_passed = False

    print()
    if all_passed:
        print(f"{GREEN}{BOLD}Todos os testes passaram.{RESET}")
    else:
        print(f"{RED}{BOLD}Um ou mais testes falharam.{RESET}")

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
