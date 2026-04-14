# Multica 供应链 Demo 深改待办总表（todo.md）

0413 这一轮任务已经全部完成，已归档到 [docs/todo0413.md](/Users/steve/Projects/github/multica/docs/todo0413.md)。

## 当前状态

- 0413 已完成任务：27 个
- 0413 进度记录：已归档
- 后续若有新任务，请直接在本文件继续追加未完成项

## 任务块约定

每个任务建议保留以下字段：

- `id`：唯一任务编号
- `priority`：P0 / P1 / P2
- `kind`：frontend / backend / database / api / design / qa / deployment
- `depends_on`：依赖任务 ID
- `scope`：必须修改的目录或文件
- `deliverables`：需要产出的代码或文档
- `acceptance`：可验证结果
- `verify`：本地验证命令
- `rollback`：回滚方式

## 执行总原则

1. 先修基线，再做语义扩展。
2. 保留底座对象，优先 sidecar 扩展。
3. 先统一中文语义，再补审批、执行和连接器。
4. 所有新增写操作都要有审计、幂等和回滚定义。
5. 控制面只存工作流元数据，事实数据仍留在外部系统。

## 待补充

- 暂无未归档任务
