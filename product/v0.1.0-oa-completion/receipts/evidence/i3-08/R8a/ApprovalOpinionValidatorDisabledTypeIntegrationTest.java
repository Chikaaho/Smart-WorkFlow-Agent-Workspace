package com.sw.ck.bpm.process.validator;

import com.sw.ck.bpm.api.exception.BpmErrorCode;
import com.sw.ck.bpm.process.dto.ApprovalAction;
import com.sw.ck.bpm.process.dto.ApprovalActionRequest;
import com.sw.ck.common.exception.BaseException;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * I3 R8a 提交层等强度验证：禁用组件类型（EMAIL，与 GET /form/def/field-types 目录中
 * enabled=false 一致）在提交层 ApprovalOpinionValidator 按同一服务端目录契约被拒。
 * 线上状态因 config 层阻断不可达（config 1205），故以本集成运行替代；
 * 输入固定同一 disabled 类型 EMAIL，并给出真实输出。
 */
class ApprovalOpinionValidatorDisabledTypeIntegrationTest {

    private ApprovalActionRequest request(Map<String, Object> opinionData) {
        ApprovalActionRequest request = new ApprovalActionRequest();
        request.setAction(ApprovalAction.APPROVE);
        request.setOpinionFormId("i3ev-r8-opinion");
        request.setOpinionFormVersion("v1");
        request.setOpinionData(opinionData);
        return request;
    }

    private Map<String, Object> opinionForm(List<Map<String, Object>> fields) {
        Map<String, Object> form = new LinkedHashMap<>();
        form.put("formId", "i3ev-r8-opinion");
        form.put("version", "v1");
        form.put("fields", fields);
        return form;
    }

    @Test
    void disabledTypeEmailRejectedBySubmitLayer() {
        // 目录中 disabled 的 EMAIL 组件进入提交层 → 按契约拒绝（2307），与 config 层 1205 同源（同一服务端组件目录）
        BaseException ex = assertThrows(BaseException.class, () -> ApprovalOpinionValidator.validate(
                request(Map.of("bad", "a@b.com")),
                opinionForm(List.of(Map.of("key", "bad", "label", "bad", "type", "EMAIL"))),
                Map.of()));
        assertEquals(BpmErrorCode.APPROVAL_OPINION_INVALID.getCode(), ex.getCode(),
                () -> "提交层对禁用组件类型的实际拒绝码=" + ex.getCode());
    }

    @Test
    void supportedTypePassesSameValidator() {
        // 对照：同一校验器对目录中 enabled 的 TEXT 类型不拒绝（证明拒绝由组件类型契约决定）
        ApprovalOpinionValidator.validate(
                request(Map.of("comment2", "ok")),
                opinionForm(List.of(Map.of("key", "comment2", "label", "审批说明", "type", "TEXT"))),
                Map.of());
    }
}
