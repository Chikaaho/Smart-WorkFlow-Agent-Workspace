#!/usr/bin/env python3
"""生成 V0.1.0 基线种子（按 vendor），合并 src/main 下全部 versioned 迁移。

规则：
- 只扫 */src/main/resources/db/migration* 下的 V*.sql（排除 devseed / target / prod-update）。
- 同 (vendor, version) 多副本必须字节一致（如 V63 在 bootstrap 与 bpm 双处），否则中止。
- 按 Flyway 版本序（数值逐段比较）拼接，段头注明来源模块。
- 输出 sw-bootstrap/src/main/resources/db/migration/<vendor>/V0.1.0__baseline_seed.sql。
- 清单写入 /tmp/squash-equiv/baseline-inventory-<vendor>.txt。
不删除任何旧文件（删除由后续 git rm 执行）。
"""
import sys
from pathlib import Path

REPO = Path("/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-aPaaS-server")
OUT_DIR = REPO / "sw-bootstrap/src/main/resources/db/migration"
EVID = Path("/tmp/squash-equiv")


def vkey(version: str):
    return tuple(int(p) for p in version.split("."))


def main():
    groups = {}  # vendor -> version -> list[(path)]
    for p in sorted(REPO.glob("**/src/main/resources/db/migration*/**/V*.sql")):
        s = str(p)
        if "/target/" in s or "/devseed/" in s or "prod-update" in s:
            continue
        # vendor = 父目录名（h2 / postgresql）
        vendor = p.parent.name
        if vendor not in ("h2", "postgresql"):
            continue
        name = p.name  # V<version>__desc.sql
        version = name[1:].split("__")[0]
        # 模块路径（仓内相对，截到模块根）
        rel = p.relative_to(REPO)
        module = str(rel).split("/src/main/resources/db/migration")[0]
        groups.setdefault(vendor, {}).setdefault(version, []).append((p, module, rel))

    for vendor in ("postgresql", "h2"):
        versions = groups.get(vendor, {})
        # 一致性校验：同版本多副本必须字节一致
        for v, copies in sorted(versions.items(), key=lambda kv: vkey(kv[0])):
            blobs = {c[0].read_bytes() for c in copies}
            if len(blobs) != 1:
                print(f"FATAL: {vendor} V{v} 存在 {len(blobs)} 种不同内容:", file=sys.stderr)
                for c in copies:
                    print("  ", c[2], file=sys.stderr)
                sys.exit(1)
        ordered = sorted(versions.items(), key=lambda kv: vkey(kv[0]))
        out = OUT_DIR / vendor / "V0.1.0__baseline_seed.sql"
        inv = EVID / f"baseline-inventory-{vendor}.txt"
        inv.parent.mkdir(parents=True, exist_ok=True)
        with out.open("wb") as w, inv.open("w") as invw:
            w.write(f"-- V0.1.0 baseline seed：{len(ordered)} 条 versioned 迁移（V1—V104）合并基线。\n".encode())
            w.write("-- 由 0.1.3 发版批次的种子合并生成：内容为原迁移链按版本序的逐字节拼接，\n".encode())
            w.write("-- 仅去除重复副本；全新建库终态与原链等价（等价性证据见 0.1.3 发布回执）。\n".encode())
            w.write("-- 0.1.3 起不支持从 ≤0.1.2 库原地升级（历史链已移除），仅支持全新建库。\n\n".encode())
            for v, copies in ordered:
                src = copies[0][0]
                modules = ",".join(sorted({c[1] for c in copies}))
                header = f"-- ======== V{v}（来源: {modules}，副本 {len(copies)} 处已去重） ========\n"
                w.write(header.encode())
                w.write(src.read_bytes())
                if not src.read_bytes().endswith(b"\n"):
                    w.write(b"\n")
                w.write(b"\n")
                invw.write(f"V{v}\t{modules}\tcopies={len(copies)}\n")
        print(f"[{vendor}] unique versioned = {len(ordered)} -> {out.name} "
              f"({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
