const fs = require('fs');
const p = 'sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/NotifySubjectBindingServiceImpl.java';
let s = fs.readFileSync(p, 'utf8');
s = s.replace('import com.sw.ck.common.crypto.AesGcmCipher;',
  'import com.sw.ck.common.crypto.AesGcmCipher;\nimport org.springframework.beans.factory.ObjectProvider;');
s = s.replace(`    @Autowired
    public NotifySubjectBindingServiceImpl(NotifySubjectBindingMapper bindingMapper,
                                           SysUserMapper sysUserMapper,
                                           AesGcmCipher notifySubjectCipher) {
        this.bindingMapper = bindingMapper;
        this.sysUserMapper = sysUserMapper;
        this.notifySubjectCipher = notifySubjectCipher;
    }`, `    @Autowired
    public NotifySubjectBindingServiceImpl(NotifySubjectBindingMapper bindingMapper,
                                           SysUserMapper sysUserMapper,
                                           ObjectProvider<AesGcmCipher> notifySubjectCipher) {
        this.bindingMapper = bindingMapper;
        this.sysUserMapper = sysUserMapper;
        // I5/I6 窄测试上下文（AuthFlow 等 TestConfig）不装配 AesGcmCipher：依赖惰性化，
        // 无密钥上下文调用绑定/解密时明确失败，不静默降级为明文
        this.notifySubjectCipher = notifySubjectCipher.getIfAvailable();
    }`);
s = s.replace('        binding.setSubjectCipher(notifySubjectCipher.encrypt(subject));',
  `        if (notifySubjectCipher == null) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "主体加密密钥未装配，拒绝绑定");
        }
        binding.setSubjectCipher(notifySubjectCipher.encrypt(subject));`);
fs.writeFileSync(p, s);
console.log('ok', s.includes('ObjectProvider<AesGcmCipher>'));
