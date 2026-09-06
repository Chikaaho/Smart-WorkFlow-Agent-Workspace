package com.sw.ck.bpm.process.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.process.dto.CommandAcceptRespDTO;
import com.sw.ck.bpm.process.entity.BpmDraft;
import com.sw.ck.bpm.process.entity.BpmFormBinding;
import com.sw.ck.bpm.process.entity.DraftStatusEnum;
import com.sw.ck.bpm.process.queue.BpmCommandQueue;
import com.sw.ck.bpm.process.queue.CommandEnvelope;
import com.sw.ck.bpm.process.service.BpmDraftService;
import com.sw.ck.bpm.process.service.BpmFormBindingService;
import com.sw.ck.bpm.process.service.BpmProcessDefService;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.response.R;
import com.sw.ck.form.api.dto.FormDefDTO;
import com.sw.ck.form.api.form.FormDefinitionService;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link BpmDraftController} 单元测试（standalone 直调方法 + LoginUserHolder 模拟登录）。
 * <p>
 * 覆盖：草稿创建（表单发布校验/版本快照）、越权访问、状态机约束（SUBMITTING 冻结）、
 * 提交校验（未选流程/无 active 绑定/表单版本不一致）、提交受理与幂等。
 * </p>
 */
@DisplayName("我的草稿控制器测试")
class BpmDraftControllerTest {

    private final BpmDraftService draftService = mock(BpmDraftService.class);
    private final BpmFormBindingService bindingService = mock(BpmFormBindingService.class);
    private final BpmProcessDefService processDefService = mock(BpmProcessDefService.class);
    private final FormDefinitionService formDefinitionService = mock(FormDefinitionService.class);
    private final BpmCommandQueue commandQueue = mock(BpmCommandQueue.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final com.sw.ck.bpm.process.service.CommandSyncWaiter syncWaiter =
            mock(com.sw.ck.bpm.process.service.CommandSyncWaiter.class);
    private final com.sw.ck.security.support.PermissionService permissionService =
            mock(com.sw.ck.security.support.PermissionService.class);

    private final com.sw.ck.form.api.facade.FormDataSubmitFacade formDataSubmitFacade =
            mock(com.sw.ck.form.api.facade.FormDataSubmitFacade.class);

    private final com.sw.ck.bpm.process.service.DraftSubmitService draftSubmitService =
            new com.sw.ck.bpm.process.service.DraftSubmitService(
                    draftService, bindingService, formDefinitionService, commandQueue, objectMapper,
                    formDataSubmitFacade);

    private final BpmDraftController controller = new BpmDraftController(
            draftService, draftSubmitService, objectMapper, syncWaiter, permissionService);

    @BeforeEach
    void setUp() {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(2L);
        loginUser.setTenantId(0L);
        LoginUserHolder.set(loginUser);
        when(formDefinitionService.canCurrentUserInitiate(anyString())).thenReturn(true);
    }

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
    }

    private FormDefDTO formDef(String status, Integer formVersion) {
        FormDefDTO dto = new FormDefDTO();
        dto.setFormKey("leave_form");
        dto.setStatus(status);
        dto.setFormVersion(formVersion);
        return dto;
    }

    private BpmDraft draft(Long id, String status) {
        BpmDraft draft = new BpmDraft();
        draft.setId(id);
        draft.setCreateBy(2L);
        draft.setFormKey("leave_form");
        draft.setFormVersion(1L);
        draft.setProcessDefKey("leave_flow");
        draft.setPayload("{}");
        draft.setStatus(status);
        draft.setSubmitSeq(0);
        return draft;
    }

    // ==================== create ====================

    @Nested
    @DisplayName("POST /workflow/drafts（create）")
    class CreateTests {

        @Test
        @DisplayName("formKey 未发布 → 抛 BaseException")
        void create_shouldRejectUnpublishedForm() {
            when(formDefinitionService.getFormDef("leave_form"))
                    .thenReturn(formDef("DRAFT", 1));

            assertThatThrownBy(() -> controller.create(Map.of("formKey", "leave_form")))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("未发布");
            verify(draftService, never()).save(any(BpmDraft.class));
        }

        @Test
        @DisplayName("create 成功：formVersion 从 FormDefDTO 快照、status=EDITING、submitSeq=0")
        void create_shouldSnapshotFormVersionAndSetEditing() {
            when(formDefinitionService.getFormDef("leave_form"))
                    .thenReturn(formDef("PUBLISHED", 3));
            when(draftService.save(any(BpmDraft.class))).thenReturn(true);

            R<BpmDraft> resp = controller.create(Map.of(
                    "formKey", "leave_form", "title", "请假", "payload", Map.of("days", 1)));

            ArgumentCaptor<BpmDraft> captor = ArgumentCaptor.forClass(BpmDraft.class);
            verify(draftService).save(captor.capture());
            BpmDraft saved = captor.getValue();
            assertThat(saved.getFormKey()).isEqualTo("leave_form");
            assertThat(saved.getFormVersion()).isEqualTo(3L);
            assertThat(saved.getStatus()).isEqualTo(DraftStatusEnum.EDITING.getCode());
            assertThat(saved.getSubmitSeq()).isZero();
            assertThat(saved.getTitle()).isEqualTo("请假");
            assertThat(saved.getPayload()).contains("days");
            assertThat(resp.getData()).isSameAs(saved);
        }
    }

    // ==================== 归属校验 ====================

    @Nested
    @DisplayName("归属校验（非本人 FORBIDDEN）")
    class OwnershipTests {

        @Test
        @DisplayName("get：非本人访问 → FORBIDDEN")
        void get_shouldRejectNonOwner() {
            BpmDraft other = draft(5L, DraftStatusEnum.EDITING.getCode());
            other.setCreateBy(999L);
            when(draftService.getById(5L)).thenReturn(other);

            assertThatThrownBy(() -> controller.get(5L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("无权访问");
        }

        @Test
        @DisplayName("update：非本人访问 → FORBIDDEN")
        void update_shouldRejectNonOwner() {
            BpmDraft other = draft(5L, DraftStatusEnum.EDITING.getCode());
            other.setCreateBy(999L);
            when(draftService.getById(5L)).thenReturn(other);

            assertThatThrownBy(() -> controller.update(5L, Map.of("title", "x")))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("无权访问");
        }

        @Test
        @DisplayName("delete：非本人访问 → FORBIDDEN")
        void delete_shouldRejectNonOwner() {
            BpmDraft other = draft(5L, DraftStatusEnum.EDITING.getCode());
            other.setCreateBy(999L);
            when(draftService.getById(5L)).thenReturn(other);

            assertThatThrownBy(() -> controller.delete(5L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("无权访问");
        }

        @Test
        @DisplayName("get：草稿不存在 → NOT_FOUND")
        void get_shouldReturn404WhenMissing() {
            when(draftService.getById(5L)).thenReturn(null);
            assertThatThrownBy(() -> controller.get(5L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不存在");
        }
    }

    // ==================== 状态机约束 ====================

    @Nested
    @DisplayName("SUBMITTING 冻结")
    class FrozenTests {

        @Test
        @DisplayName("update：SUBMITTING 状态 → 拒绝")
        void update_shouldRejectSubmitting() {
            when(draftService.getById(5L))
                    .thenReturn(draft(5L, DraftStatusEnum.SUBMITTING.getCode()));

            assertThatThrownBy(() -> controller.update(5L, Map.of("title", "x")))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不可编辑");
        }

        @Test
        @DisplayName("delete：SUBMITTING → 拒绝")
        void delete_shouldRejectSubmitting() {
            when(draftService.getById(5L))
                    .thenReturn(draft(5L, DraftStatusEnum.SUBMITTING.getCode()));

            assertThatThrownBy(() -> controller.delete(5L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不能删除");
        }
    }

    // ==================== submit ====================

    @Nested
    @DisplayName("POST /{id}/submit")
    class SubmitTests {

        @Test
        @DisplayName("D3：受理前字段级校验失败 → 不产生命令、冻结不发生")
        void submit_shouldRejectWhenFieldValidationFails() {
            BpmDraft d = draft(9L, DraftStatusEnum.EDITING.getCode());
            when(draftService.getById(9L)).thenReturn(d);
            when(formDefinitionService.getFormDef("leave_form"))
                    .thenReturn(formDef("PUBLISHED", 1));
            com.sw.ck.bpm.process.entity.BpmFormBinding binding =
                    new com.sw.ck.bpm.process.entity.BpmFormBinding();
            binding.setFormKey("leave_form");
            binding.setProcessDefKey("leave_flow");
            binding.setActive(true);
            when(bindingService.findActiveByFormKey("leave_form")).thenReturn(List.of(binding));
            org.mockito.Mockito.doThrow(new BaseException(1401, "必填字段 'applicant' 缺失"))
                    .when(formDataSubmitFacade).validateSubmission(anyString(), any());

            assertThatThrownBy(() -> controller.submit(9L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("必填字段");
            verify(commandQueue, never()).enqueue(any(CommandEnvelope.class));
            verify(draftService, never()).updateById(any(BpmDraft.class));
            org.mockito.Mockito.verify(formDataSubmitFacade)
                    .validateSubmission(anyString(), any());
        }

        @Test
        @DisplayName("系统未解析到流程绑定 → 报错")
        void submit_shouldRejectMissingSystemBinding() {
            BpmDraft d = draft(5L, DraftStatusEnum.EDITING.getCode());
            d.setProcessDefKey(null);
            when(draftService.getById(5L)).thenReturn(d);
            when(formDefinitionService.getFormDef("leave_form"))
                    .thenReturn(formDef("PUBLISHED", 1));

            assertThatThrownBy(() -> controller.submit(5L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("尚未关联");
        }

        @Test
        @DisplayName("所选流程无 active 绑定 → 报错")
        void submit_shouldRejectWhenNoActiveBinding() {
            when(draftService.getById(5L)).thenReturn(draft(5L, DraftStatusEnum.EDITING.getCode()));
            when(formDefinitionService.getFormDef("leave_form"))
                    .thenReturn(formDef("PUBLISHED", 1));
            when(bindingService.findActiveByFormKey("leave_form")).thenReturn(List.of());

            assertThatThrownBy(() -> controller.submit(5L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("尚未关联");
        }

        @Test
        @DisplayName("表单版本不一致 → 报错且草稿状态保留（不落任何更新）")
        void submit_shouldRejectFormVersionMismatchAndKeepDraft() {
            BpmDraft d = draft(5L, DraftStatusEnum.EDITING.getCode());
            when(draftService.getById(5L)).thenReturn(d);
            when(formDefinitionService.getFormDef("leave_form"))
                    .thenReturn(formDef("PUBLISHED", 2));

            assertThatThrownBy(() -> controller.submit(5L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("表单已发布新版本");

            assertThat(d.getStatus()).isEqualTo(DraftStatusEnum.EDITING.getCode());
            verify(draftService, never()).updateById(any(BpmDraft.class));
            verify(commandQueue, never()).enqueue(any());
        }

        @Test
        @DisplayName("成功路径：draft 转 SUBMITTING、submit_seq=1、enqueue 收到 FLOW 键且 commandId 回写")
        void submit_shouldFreezeDraftAndEnqueueCommand() {
            BpmDraft d = draft(5L, DraftStatusEnum.EDITING.getCode());
            when(draftService.getById(5L)).thenReturn(d);
            when(formDefinitionService.getFormDef("leave_form"))
                    .thenReturn(formDef("PUBLISHED", 1));
            BpmFormBinding binding = new BpmFormBinding();
            binding.setFormKey("leave_form");
            binding.setProcessDefKey("leave_flow");
            binding.setActive(true);
            when(bindingService.findActiveByFormKey("leave_form")).thenReturn(List.of(binding));
            when(draftService.updateById(any(BpmDraft.class))).thenReturn(true);
            when(commandQueue.enqueue(any(CommandEnvelope.class))).thenAnswer(inv -> {
                CommandEnvelope env = inv.getArgument(0);
                env.setCommandId(33L);
                return 33L;
            });

            R<CommandAcceptRespDTO> resp = controller.submit(5L);

            assertThat(resp.getData().getCommandId()).isEqualTo(33L);
            assertThat(resp.getData().getCommandKey()).isEqualTo("DRAFT_SUBMIT:5:1");
            assertThat(resp.getData().isDuplicated()).isFalse();

            ArgumentCaptor<CommandEnvelope> envCaptor = ArgumentCaptor.forClass(CommandEnvelope.class);
            verify(commandQueue).enqueue(envCaptor.capture());
            CommandEnvelope env = envCaptor.getValue();
            assertThat(env.getCommandType()).isEqualTo(com.sw.ck.bpm.process.entity.CommandTypeEnum.DRAFT_SUBMIT);
            assertThat(env.getChannel()).isEqualTo(com.sw.ck.bpm.process.entity.CommandChannelEnum.NORMAL);
            assertThat(env.getCommandKey()).isEqualTo("DRAFT_SUBMIT:5:1");
            assertThat(env.getTenantId()).isEqualTo(0L);
            assertThat(env.getInitiatorId()).isEqualTo(2L);
            assertThat(env.getPayload()).contains("leave_form").contains("submittedData");

            ArgumentCaptor<BpmDraft> draftCaptor = ArgumentCaptor.forClass(BpmDraft.class);
            verify(draftService, org.mockito.Mockito.times(2)).updateById(draftCaptor.capture());
            List<BpmDraft> updates = draftCaptor.getAllValues();
            assertThat(updates.get(0).getStatus()).isEqualTo(DraftStatusEnum.SUBMITTING.getCode());
            assertThat(updates.get(0).getSubmitSeq()).isEqualTo(1);
            assertThat(updates.get(1).getCommandId()).isEqualTo(33L);
        }

        @Test
        @DisplayName("重复 submit（已 SUBMITTING 且 commandId 可查到）→ duplicated=true")
        void submit_shouldReturnDuplicatedWhenAlreadySubmitting() {
            BpmDraft d = draft(5L, DraftStatusEnum.SUBMITTING.getCode());
            d.setCommandId(33L);
            when(draftService.getById(5L)).thenReturn(d);
            CommandEnvelope existing = new CommandEnvelope();
            existing.setCommandId(33L);
            existing.setCommandKey("DRAFT_SUBMIT:5:1");
            existing.setCommandType(com.sw.ck.bpm.process.entity.CommandTypeEnum.DRAFT_SUBMIT);
            existing.setChannel(com.sw.ck.bpm.process.entity.CommandChannelEnum.NORMAL);
            when(commandQueue.findById(33L)).thenReturn(Optional.of(existing));

            R<CommandAcceptRespDTO> resp = controller.submit(5L);

            assertThat(resp.getData().isDuplicated()).isTrue();
            assertThat(resp.getData().getCommandId()).isEqualTo(33L);
            verify(commandQueue, never()).enqueue(any());
        }

        @Test
        @DisplayName("P0 无专用权限 → 先拒绝且不读取/冻结/受理草稿")
        void submitP0_shouldRejectBeforeAcceptWhenPermissionMissing() {
            when(permissionService.hasPermi("workflow:p0:dispatch")).thenReturn(false);

            assertThatThrownBy(() -> controller.submit(5L, "P0"))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("workflow:p0:dispatch");

            verify(draftService, never()).getById(anyLong());
            verify(commandQueue, never()).enqueue(any());
        }

        @Test
        @DisplayName("P0 有专用权限 → 受理命令通道为 P0 并等待终态")
        void submitP0_shouldEnqueueP0AndWait() {
            BpmDraft d = draft(5L, DraftStatusEnum.EDITING.getCode());
            when(permissionService.hasPermi("workflow:p0:dispatch")).thenReturn(true);
            when(draftService.getById(5L)).thenReturn(d);
            when(formDefinitionService.getFormDef("leave_form"))
                    .thenReturn(formDef("PUBLISHED", 1));
            BpmFormBinding binding = new BpmFormBinding();
            binding.setFormKey("leave_form");
            binding.setProcessDefKey("leave_flow");
            binding.setActive(true);
            when(bindingService.findActiveByFormKey("leave_form")).thenReturn(List.of(binding));
            when(draftService.updateById(any(BpmDraft.class))).thenReturn(true);
            when(commandQueue.enqueue(any(CommandEnvelope.class))).thenAnswer(inv -> {
                CommandEnvelope env = inv.getArgument(0);
                env.setCommandId(44L);
                return 44L;
            });
            when(syncWaiter.waitTerminal(44L)).thenReturn(new com.sw.ck.bpm.process.service.CommandSyncWaiter.WaitResult(
                    com.sw.ck.bpm.process.service.CommandSyncWaiter.Outcome.COMPLETED, null));

            R<CommandAcceptRespDTO> resp = controller.submit(5L, "P0");

            assertThat(resp.getData().getCommandId()).isEqualTo(44L);
            assertThat(resp.getData().getStatus()).isEqualTo("COMPLETED");
            ArgumentCaptor<CommandEnvelope> envCaptor = ArgumentCaptor.forClass(CommandEnvelope.class);
            verify(commandQueue).enqueue(envCaptor.capture());
            assertThat(envCaptor.getValue().getChannel()).isEqualTo(
                    com.sw.ck.bpm.process.entity.CommandChannelEnum.P0);
        }
    }
}
