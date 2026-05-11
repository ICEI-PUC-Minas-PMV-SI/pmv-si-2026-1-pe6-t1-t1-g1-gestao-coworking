import argparse
import json
import statistics
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed


def call(base_url, path):
    started = time.perf_counter()
    status = 0
    error = None
    try:
        with urllib.request.urlopen(base_url + path, timeout=15) as response:
            response.read()
            status = response.status
    except urllib.error.HTTPError as exc:
        status = exc.code
        error = str(exc)
    except Exception as exc:
        error = str(exc)

    elapsed = time.perf_counter() - started
    return {"path": path, "status": status, "elapsed": elapsed, "error": error}


def percentile(values, percent):
    if not values:
        return 0
    ordered = sorted(values)
    index = min(len(ordered) - 1, round((percent / 100) * (len(ordered) - 1)))
    return ordered[index]


def main():
    parser = argparse.ArgumentParser(description="Teste de carga simples da API Axis Working.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8001")
    parser.add_argument("--users", type=int, default=20)
    parser.add_argument("--requests", type=int, default=200)
    args = parser.parse_args()

    paths = [
        "/health",
        "/api/salas",
        "/api/planos",
        "/api/reservas?limit=10",
        "/api/avaliacoes",
        "/notificacoes/cliente/1",
    ]

    started = time.perf_counter()
    results = []
    with ThreadPoolExecutor(max_workers=args.users) as executor:
        futures = [
            executor.submit(call, args.base_url, paths[index % len(paths)])
            for index in range(args.requests)
        ]
        for future in as_completed(futures):
            results.append(future.result())

    total_time = time.perf_counter() - started
    elapsed = [item["elapsed"] for item in results]
    success = [item for item in results if 200 <= item["status"] < 400]
    failures = [item for item in results if item not in success]

    report = {
        "base_url": args.base_url,
        "users": args.users,
        "requests": args.requests,
        "success": len(success),
        "failures": len(failures),
        "requests_per_second": round(args.requests / total_time, 2) if total_time else 0,
        "avg_ms": round(statistics.mean(elapsed) * 1000, 2) if elapsed else 0,
        "p95_ms": round(percentile(elapsed, 95) * 1000, 2),
        "max_ms": round(max(elapsed) * 1000, 2) if elapsed else 0,
        "failure_samples": failures[:5],
    }

    print(json.dumps(report, indent=2, ensure_ascii=False))
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
