# 失败轮登记(不可覆盖原则)
# round1: -pl sw-bootstrap 未带 -am,bootstrap 解析到 ~/.m2 旧版 sw-bpm-process jar,修复未生效→2F(异载荷仍code0);处置=先 mvn install 生产模块再跑
# round2: 修复生效但同载荷重放被误判2426——ApprovalOpinionValidator.ensureDefaultRemark 在执行核心填充 opinion_form_id=DEFAULT_REMARK/version=1/空comment补串,重放请求未经填充→比对不一致;1F+1E
# 定位: debug-field-diagnosis-run.log 中字段级诊断日志(意见表单缺省填充语义纳入比对口径后修复)
# 另: P62OverlapEffectsPgTest 首轮 NoSuchFileException 为执行侧未创建 evidence dir(环境操作失误,非代码),建目录后通过
