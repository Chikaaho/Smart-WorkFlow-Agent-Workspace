const { challengeLogin, req } = require('../../i6-04/object-setup/harness');

const CHANNELS = ['SMS', 'EMAIL', 'FEISHU', 'DINGTALK', 'WECHAT_WORK'];

function bodyData(body) {
  return Array.isArray(body?.data) ? body.data : [];
}

(async () => {
  const admin = await challengeLogin('u1_100');
  const response = await req(admin.token, 'GET', '/notify/channels');
  const rows = bodyData(response.body);
  const byChannel = new Map(rows.map(row => [String(row.channel || '').toUpperCase(), row]));
  const channels = CHANNELS.map(channel => {
    const row = byChannel.get(channel);
    return {
      channel,
      apiRowPresent: Boolean(row),
      systemConfigured: row?.systemConfigured === true,
      tenantEnabled: row?.tenantEnabled === true,
      senderDisplayPresent: Boolean(row?.senderDisplay),
      configSummaryPresent: Boolean(row?.configSummary),
    };
  });
  console.log(JSON.stringify({ httpStatus: response.status, code: response.body?.code ?? null, channels }));
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
