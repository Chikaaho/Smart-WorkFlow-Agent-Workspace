/** P53 review-05 设计节点 → 运行路由/交互/fixture 映射（唯一事实源，capture 与 compare 共用）。 */

export const FAMILIES = {
  a: { id: 'family-a', nodes: ['01', '04', '05', '06', '21', '27'] },
  b: { id: 'family-b', nodes: ['02', '03', '19', '20', '22', '23', '24', '25', '26'] },
  c: { id: 'family-c', nodes: ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18'] },
  d: { id: 'family-d', nodes: ['28', '29', '30', '32'] },
}

/** 节点31 按方向 §5 仅保留未来参考，无运行时入口（31 适用节点 = 32 - 31）。 */
export const NODES = {
  '01': { route: '/workspace', ready: '.wsd__greeting', fixture: 'node01' },
  '02': { route: '/workflow/my-instances', ready: '.el-table__row' },
  '03': { route: '/workflow/task/mock-task-001', ready: '.detail-header' },
  '04': { route: '/form/form-def-list', ready: '.el-table__row', admin: true },
  '05': { route: '/portal', ready: '.portal__hero' },
  '06': { route: '/login', ready: '.login-page__card', public: true },
  '07': { route: '/form/designer/seed-def-001', ready: '.designer' },
  '08': { designerTab: '关联流程' },
  '08': { route: '/form/designer/seed-def-001?tab=processes', ready: '.designer' },
  '09': { route: '/workflow/defs/1/design', ready: '.designer-canvas-wrap,.designer-body' },
  '09': { route: '/workflow/defs/2100424929376403458/design', ready: '.designer-canvas-wrap,.designer-body', waitMs: 6000 },
  '10': { taskTab: 'graph' },
  '11': { designerTab: '字段属性' },
  '11': { designerDialog: '字段清单' },
  '12': { processDesignerApprover: true },
  '13': { route: '/notify/template', ready: '.basic-layout__topbar' },
  '13': { route: '/notify/template', ready: '.basic-layout__topbar', base: 'real' },
  '14': { designerTab: '草稿历史' },
  '14': { designerDialog: '历史版本' },
  '15': { taskTab: 'people', openDetail: 'node15' },
  '15': { taskTab: 'people', openDetail: 'node15', fixture: 'node15' },
  '16': { taskTab: 'people', openSign: 'node16' },
  '16': { taskTab: 'people', openSign: 'node16', fixture: 'node16' },
  '17': { taskTab: 'people', openDetail: 'node17' },
  '17': { taskTab: 'people', openDetail: 'node17', fixture: 'node17' },
  '18': { taskTab: 'people', openDetail: 'node18' },
  '18': { taskTab: 'people', openDetail: 'node18', fixture: 'node18' },
  '19': { taskTab: 'graph', viewport: { width: 1440, height: 1512 } },
  '20': { taskTab: 'people' },
  '21': { route: '/workflow/catalog', ready: '.catalog-card', fixture: 'node21' },
  '22': { catalog: 0, fixture: 'node22' },
  '23': { catalog: 1, fixture: 'node23' },
  '24': { catalog: 2, fixture: 'node24' },
  '25': { catalog: 3, fixture: 'node25' },
  '26': { catalog: 4, fixture: 'node26' },
  '27': { route: '/form/form-render/leave-request', ready: '.form-render-page__card' },
  '28': { userMenu: 'portal' },
  '29': { userMenu: 'admin' },
  '30': { userMenu: 'portal', fixture: 'node30' },
  '32': { userMenu: 'admin', fixture: 'node32' },
}

for (const [seq, family] of Object.entries(FAMILIES)) {
  for (const node of family.nodes) {
    if (!NODES[node]) throw new Error('node missing in NODES: ' + node)
    if (NODES[node].family) throw new Error('node family already set: ' + node)
    NODES[node].family = family.id
  }
}
