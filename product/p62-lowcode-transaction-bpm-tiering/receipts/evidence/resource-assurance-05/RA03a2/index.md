# RA03a2 manage 全局授权边界

证据=../ra03a-isolation/{manage-global-boundary.txt,tenant-isolation.txt,auth-matrix.txt}

缺口→结果：查看隔离已证（复核04 tenant-isolation：他租户同id 403/查看强制本租户）；manage 全局边界=本回执新增矩阵：仅view租户身份跨域读无他租户数据+写403 → 显式授予 workflow:resource:manage（sys_role/sys_role_menu 真实链）后可全局读(按tenantId参数)+全局建策略 → 撤销该菜单授权后能力即时收回（读强制本租户+写403），策略行逐项不变回读；菜单9106/9107/9108权限码与授权链原文在案。HTTP200+业务code403 如实呈现。
recordedAt=2026-10-04T00:56:17+08:00
