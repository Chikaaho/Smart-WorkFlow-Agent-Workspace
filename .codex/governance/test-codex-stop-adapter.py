"""Bounded native Windows transport regression; does not impersonate app dispatch."""
import base64, json, os, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PS = str(Path(os.environ['SystemRoot'])/'System32/WindowsPowerShell/v1.0/powershell.exe')
CMD = str(Path(os.environ['SystemRoot'])/'System32/cmd.exe')
HOOK = ROOT/'.codex/hooks/codex-stop-adapter.ps1'

def run(command, payload, *, cwd=ROOT, env=None, timeout=40):
    process = subprocess.Popen(command, cwd=cwd, env=env, stdin=subprocess.PIPE,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               creationflags=subprocess.CREATE_NO_WINDOW)
    try:
        stdout, stderr = process.communicate(json.dumps(payload, ensure_ascii=False).encode('utf-8'), timeout=timeout)
    except subprocess.TimeoutExpired:
        subprocess.run([os.environ['SystemRoot']+'/System32/taskkill.exe', '/PID', str(process.pid), '/T', '/F'], capture_output=True, timeout=5)
        process.communicate(timeout=5)
        raise
    return {'exit':process.returncode, 'stdout':stdout.decode('utf-8', 'replace'), 'stderr':stderr.decode('utf-8', 'replace')}

def main():
    declaration = json.loads((ROOT/'.codex/hooks.json').read_text(encoding='utf-8'))['hooks']['Stop'][0]['hooks'][0]
    encoded=declaration['commandWindows'].split('-EncodedCommand ',1)[1]
    assert base64.b64decode(encoded).decode('utf-16le')==(ROOT/'.codex/hooks/codex-stop-bootstrap.ps1').read_text(encoding='utf-8')
    clean = {k:v for k,v in os.environ.items() if not k.startswith('AGENT_CODING_ENGINE_')}
    results = []
    baseline = run(f'"{CMD}" /D /S /C "{declaration["command"]}"', {}, env=clean)
    assert baseline['exit'] != 0 or baseline['stderr']
    results.append({'case':'baseline-posix-in-cmd', **baseline})
    terminal = {'schema':'agent-coding-engine.executor-terminal.v2','role':'executor','state':'TASK_COMPLETED','task_level':'S','evidence':['focused-check:0 中文']}
    marker = json.loads((ROOT/'.codex/governance/terminal-contract.json').read_text(encoding='utf-8'))['marker']
    cases = [
        ('unbound', {}, None, None),
        ('planner', {'active_role':'planner'}, None, None),
        ('admin', {'active_role':'admin'}, None, None),
        ('valid-utf8', {'active_role':'executor','last_assistant_message':marker+' '+json.dumps(terminal,ensure_ascii=False)}, None, None),
        ('missing-marker', {'active_role':'executor','last_assistant_message':'还有动作'}, None, '执行会话不能结束'),
        ('invalid-terminal', {'active_role':'executor','last_assistant_message':marker+' {}'}, None, 'missing required field'),
        ('known-background-without-observation', {'active_role':'executor','background_tasks':[{'task_id':'owned'}]}, None, 'execution'),
        ('bad-python', {'active_role':'executor'}, {'AGENT_CODING_ENGINE_PYTHON':os.environ['LOCALAPPDATA']+'/Microsoft/WindowsApps/python3.exe'}, 'PYTHON_UNAVAILABLE'),
        ('bad-jq', {'active_role':'executor'}, {'AGENT_CODING_ENGINE_JQ':str(ROOT/'missing-jq.exe')}, 'JQ_UNAVAILABLE'),
        ('bad-shell', {'active_role':'executor'}, {'AGENT_CODING_ENGINE_SH':str(ROOT/'missing-sh.exe')}, 'SHELL_UNAVAILABLE'),
        ('stable-identity-incomplete', {'active_role':'executor'}, {'AGENT_CODING_ENGINE_TASK_ID':'test-owned'}, 'task/thread'),
    ]
    for name,payload,extra,reason in cases:
        env = {**clean, **(extra or {})}
        payload = {'session_id':'codex-adapter-component-'+name,'hook_event_name':'Stop', **payload}
        result = run([PS,'-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',str(HOOK)],payload,env=env)
        assert result['exit']==0 and not result['stderr'], (name,result)
        if reason:
            decision = json.loads(result['stdout']); assert decision['decision']=='block' and reason in decision['reason'],(name,result)
        else: assert not result['stdout'].strip(),(name,result)
        results.append({'case':name,**result})
        print('PASS '+name,file=sys.stderr,flush=True)
    with tempfile.TemporaryDirectory(prefix='codex-native-role-') as directory:
        transcript = Path(directory)/'rollout.jsonl'
        submitted = {
            'schema':terminal['schema'], 'role':'executor', 'state':'EXECUTION_SUBMITTED', 'task_level':'XL',
            'receipt':'product/demo/receipts/form-config.md', 'evidence':['governance-regression:0'],
            'feature_status':'IN_PROGRESS',
            'work_items':[{'id':'form-config','status':'COMPLETED','authorized':True,
                           'dependency_satisfied':True,'actionable':False,'next_action':'Planner 验收'}],
            'remaining_actionable_count':0, 'independent_work_exhausted':False,
            'next_action':'Planner 验收；随后继续表单事件与函数', 'next_action_type':'WAIT_PLANNER',
            'progress_fingerprint':'native-intermediate-report',
            'progress_basis':{'files_changed':[],'tool_actions':['verify'],'new_evidence':[],'closed_work_items':['form-config']},
            'stop_reason':'WAITING_FOR_PLANNER','tool_results':[],'browser_status':'OPERABLE',
        }
        for name,prompt,message,identity,reason in [
            ('native-executor-missing-marker','你是执行，继续任务','还有动作','native-role','执行会话不能结束'),
            ('native-executor-valid','你是执行，继续任务',marker+' '+json.dumps(terminal),'native-role',None),
            ('native-planner','你是规划，恢复上下文','待规划验收','native-role',None),
            ('native-admin','你是管理员，检查 hook','检查完成','native-role',None),
            ('native-foreign-session','你是执行，继续任务','还有动作','other-role','ROLE_SESSION_MISMATCH'),
            ('native-intermediate-report','你是执行，继续任务',marker+' '+json.dumps(submitted),'native-role','independent_work_exhausted'),
            ('native-unreadable-transcript','你是执行，继续任务','还有动作','native-role','ROLE_OBSERVATION_UNAVAILABLE'),
        ]:
            records=[{'type':'session_meta','payload':{'id':identity,'cwd':str(ROOT)}},
                     {'type':'response_item','payload':{'type':'message','role':'user',
                      'content':[{'type':'input_text','text':prompt}]}}]
            transcript.write_text('\n'.join(json.dumps(r,ensure_ascii=False) for r in records)+'\n',encoding='utf-8')
            payload={'session_id':'native-role','cwd':str(ROOT),'transcript_path':str(transcript),
                     'hook_event_name':'Stop','last_assistant_message':message}
            if name=='native-unreadable-transcript': transcript.unlink()
            result=run([PS,'-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',str(HOOK)],payload,env=clean)
            assert result['exit']==0 and not result['stderr'],(name,result)
            if reason:
                decision=json.loads(result['stdout'])
                assert decision['decision']=='block' and reason in decision['reason'],(name,result)
                if name=='native-intermediate-report':
                    assert '先处理公共 Validator 的拒绝原因' in decision['reason'],(name,result)
                    assert '原子动作：Planner' not in decision['reason'],(name,result)
            else: assert not result['stdout'].strip(),(name,result)
            results.append({'case':name,**result})
            print('PASS '+name,file=sys.stderr,flush=True)
    for name,cwd in [('root',ROOT),('nested',ROOT/'.codex/governance'),('subrepository',ROOT/'Smart-WorkFlow-aPaaS-server')]:
        result=run(f'"{CMD}" /D /S /C "{declaration["commandWindows"]}"', {'active_role':'executor','last_assistant_message':marker+' '+json.dumps(terminal,ensure_ascii=False)},cwd=cwd,env=clean)
        assert result['exit']==0 and not result['stdout'].strip() and not result['stderr'],(name,result)
        results.append({'case':'declaration-'+name,**result})
    result=run([PS,'-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',str(HOOK),'-GateTimeoutMs','1'],{'session_id':'codex-adapter-timeout','active_role':'executor'},env=clean)
    assert result['exit']==0 and json.loads(result['stdout'])['decision']=='block' and 'GATE_PROCESS_FAILED' in result['stdout'],result
    results.append({'case':'gate-timeout',**result})
    result=run([PS,'-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',str(HOOK)],['invalid-array'],env=clean)
    assert result['exit']==0 and 'PAYLOAD_INVALID' in result['stdout'],result
    results.append({'case':'invalid-payload',**result})
    result=run([PS,'-NoLogo','-NoProfile','-NonInteractive','-Command',declaration['commandWindows']], {'active_role':'executor','last_assistant_message':marker+' '+json.dumps(terminal,ensure_ascii=False)},env=clean)
    assert result['exit']==0 and not result['stdout'].strip() and not result['stderr'],result
    results.append({'case':'declaration-powershell-host',**result})
    print(json.dumps({'passed':len(results),'results':results},ensure_ascii=False))

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
