/** P53 review-06 设计节点 → 运行路由/交互/fixture 映射（唯一事实源，capture 与 compare 共用）。 */

export const FAMILIES = {
  a: { id: 'family-a', nodes: ['01', '04', '05', '06', '21', '27'] },
  b: { id: 'family-b', nodes: ['02', '03', '19', '20', '22', '23', '24', '25', '26'] },
  c: { id: 'family-c', nodes: ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18'] },
  d: { id: 'family-d', nodes: ['28', '29', '30', '32'] },
}

/** 节点31 按方向 §5 仅保留未来参考，无运行时入口（31 适用节点 = 32 - 31）。 */
export const NODES = {
  '01': { route: '/workspace', ready: '.wsd__greeting', fixture: 'node01' },
  '02': { route: '/workflow/my-instances', ready: '.el-table__row', fixture: 'node02' },
  '03': { route: '/workflow/task/mock-task-001', ready: '.detail-header', fixture: 'node03' },
  '04': { route: '/form/form-def-list', admin: true, adminRoute: '/workflow/defs', ready: '.el-table__row', fixture: 'node04' },
  '05': { route: '/portal', ready: '.portal__hero', fixture: 'node05' },
  '06': { route: '/login', ready: '.login-page__card', public: true, fixture: 'node06' },
  '07': { route: '/form/designer/seed-def-001', ready: '.designer', clickField: true, fixture: 'node07' },
  '08': { route: '/form/designer/seed-def-001?tab=processes', ready: '.designer', fixture: 'node08' },
  '09': { flowDesigner: true, clickNodeText: '办公室资产管理员意见', fixture: 'node09' },
  '10': { route: '/workflow/task/mock-task-001/graph', ready: '.task-graph-page__canvas', fixture: 'node10' },
  '11': { designerDialog: '字段清单', clickField: true, fixture: 'node11' },
  '12': { flowDesigner: true, clickNodeText: '办公室资产管理员意见', processDesignerApprover: true, fixture: 'node12' },
  '13': { flowDesigner: true, clickNodeText: '办公室资产管理员意见', advancedConfig: true, fixture: 'node13' },
  '14': { designerDialog: '草稿历史', fixture: 'node14' },
  '15': { taskTab: 'people', openDetail: 'node15', openDetailRow: '陈曦', fixture: 'node15' },
  '16': { taskTab: 'people', openSign: true, fixture: 'node16' },
  '17': { taskTab: 'people', openDetail: 'node17', openDetailRow: '周明', fixture: 'node17' },
  '18': { taskTab: 'people', openDetail: 'node18', openDetailRow: '李宁', fixture: 'node18' },
  '19': { taskTab: 'graph', viewport: { width: 1440, height: 1512 }, fixture: 'node03' },
  '20': { taskTab: 'people', fixture: 'node03' },
  '21': { route: '/workflow/catalog', ready: '.catalog-card', fixture: 'node21' },
  '22': { catalog: 0, fixture: 'node22' },
  '23': { catalog: 1, fixture: 'node23' },
  '24': { catalog: 2, fixture: 'node24' },
  '25': { catalog: 3, fixture: 'node25' },
  '26': { catalog: 4, fixture: 'node26' },
  '27': { route: '/form/form-render/leave-request', ready: '.form-render-page__card', fixture: 'node27' },
  '28': { route: '/workflow/catalog', userMenu: 'portal', fixture: 'node28' },
  '29': { userMenu: 'admin', adminRoute: '/workflow/defs', fixture: 'node29' },
  '30': { route: '/workflow/catalog', userMenu: 'portal', fixture: 'node28', refOverride: '28' },
  '32': { route: '/form/form-def-list', admin: true, adminRoute: '/workflow/defs', userMenu: 'admin', fixture: 'node29', refOverride: '29' },
}

for (const [seq, family] of Object.entries(FAMILIES)) {
  for (const node of family.nodes) {
    if (!NODES[node]) throw new Error('node missing in NODES: ' + node)
    if (NODES[node].family) throw new Error('node family already set: ' + node)
    NODES[node].family = family.id
  }
}
