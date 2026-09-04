set -euo pipefail
TAG="build-${GITHUB_SHA}"
# 固定发布目标：tag 与本次构建提交（完整 SHA）绑定，main 后续推进不改变目标。
# 查询既有 tag 目标（仅 fetch 引用，不创建）。查询失败（网络/远端异常）必须
# 停止发布——不得把查询失败当作无 tag 继续，避免在未知状态下删除/重建 Release。
EXISTING_TAG_TARGET=$(git ls-remote --tags origin "refs/tags/${TAG}" | awk '{print $1}')
if [ -n "${EXISTING_TAG_TARGET}" ] && [ "${EXISTING_TAG_TARGET}" != "${GITHUB_SHA}" ]; then
echo "::error::tag ${TAG} 已指向其他提交 ${EXISTING_TAG_TARGET}，拒绝覆盖其他提交的发行物"
exit 1
fi
# 同提交重跑：仅删除既有 Release（保留 tag），随后重建；不删除其他 tag/Release。
gh release view "${TAG}" >/dev/null 2>&1 && gh release delete "${TAG}" --yes || true
gh release create "${TAG}" \
--target "${GITHUB_SHA}" \
--title "CH-aPaaS-Server 1.0.0-SNAPSHOT build ${GITHUB_SHA}" \
--notes "自动构建产物（提交 ${GITHUB_SHA}，分支 main）" \
"sw-bootstrap/target/bootstrap.jar#bootstrap.jar"
