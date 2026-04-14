"use client";

import { useState } from "react";
import { Clock, MessageSquare, AtSign, Calendar, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import type { Agent, AgentTrigger, AgentTriggerType } from "@multica/core/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@multica/ui/components/ui/dialog";
import { Button } from "@multica/ui/components/ui/button";
import { Input } from "@multica/ui/components/ui/input";
import { Label } from "@multica/ui/components/ui/label";
import { Textarea } from "@multica/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@multica/ui/components/ui/select";
import { toast } from "sonner";
import { api } from "@multica/core/api";
import { useWorkspaceId } from "@multica/core/hooks";
import { workspaceKeys } from "@multica/core/workspace/queries";
import { useQueryClient } from "@tanstack/react-query";

interface TriggersTabProps {
  agent: Agent;
}

const triggerTypeConfig: Record<AgentTriggerType, { label: string; icon: typeof Clock; description: string; color: string }> = {
  on_assign: {
    label: "被指派时",
    icon: AtSign,
    description: "当有任务被指派给此数字员工时自动触发",
    color: "text-blue-500",
  },
  on_comment: {
    label: "有新评论时",
    icon: MessageSquare,
    description: "当任务有新的评论时自动触发",
    color: "text-green-500",
  },
  on_mention: {
    label: "被提及时",
    icon: AtSign,
    description: "当有人在评论中 @ 此数字员工时自动触发",
    color: "text-purple-500",
  },
  scheduled: {
    label: "定时任务",
    icon: Calendar,
    description: "按照设定的时间计划自动触发",
    color: "text-orange-500",
  },
};

const timezoneOptions = [
  { value: "Asia/Shanghai", label: "中国标准时间 (UTC+8)" },
  { value: "Asia/Tokyo", label: "日本标准时间 (UTC+9)" },
  { value: "America/New_York", label: "美东时间 (UTC-5)" },
  { value: "America/Los_Angeles", label: "美西时间 (UTC-8)" },
  { value: "Europe/London", label: "英国时间 (UTC+0)" },
  { value: "UTC", label: "UTC" },
];

const cronPresets = [
  { label: "每天早上 9 点", value: "0 9 * * *" },
  { label: "每周一早上 9 点", value: "0 9 * * 1" },
  { label: "每月 1 号早上 9 点", value: "0 9 1 * *" },
  { label: "每 30 分钟", value: "*/30 * * * *" },
  { label: "每小时", value: "0 * * * *" },
  { label: "每天中午 12 点", value: "0 12 * * *" },
  { label: "每周五下午 5 点", value: "0 17 * * 5" },
];

export function TriggersTab({ agent }: TriggersTabProps) {
  const qc = useQueryClient();
  const wsId = useWorkspaceId();
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state for add
  const [triggerType, setTriggerType] = useState<AgentTriggerType>("on_assign");
  const [cronExpression, setCronExpression] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState("Asia/Shanghai");
  const [promptText, setPromptText] = useState("");
  const [customCron, setCustomCron] = useState(false);

  const triggers = agent.triggers || [];

  const handleAddTrigger = async () => {
    if (triggerType === "scheduled") {
      if (!cronExpression) {
        toast.error("请选择或输入 Cron 表达式");
        return;
      }
      if (!promptText.trim()) {
        toast.error("请输入触发时的提示词");
        return;
      }
    }

    setSaving(true);
    try {
      const newTrigger: AgentTrigger = {
        id: crypto.randomUUID(),
        type: triggerType,
        enabled: true,
        created_at: new Date().toISOString(),
        ...(triggerType === "scheduled" && {
          cron: cronExpression,
          timezone: selectedTimezone,
          prompt: promptText,
        }),
      };
      const newTriggers = [...triggers, newTrigger];
      await api.updateAgent(agent.id, { triggers: newTriggers });
      qc.invalidateQueries({ queryKey: workspaceKeys.agents(wsId) });
      toast.success("触发器已添加");
      resetForm();
      setShowAddDialog(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "添加触发器失败");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTrigger = async (triggerId: string) => {
    setSaving(true);
    try {
      const newTriggers = triggers.map((t) =>
        t.id === triggerId ? { ...t, enabled: !t.enabled } : t
      );
      await api.updateAgent(agent.id, { triggers: newTriggers });
      qc.invalidateQueries({ queryKey: workspaceKeys.agents(wsId) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新触发器失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    setSaving(true);
    try {
      const newTriggers = triggers.filter((t) => t.id !== triggerId);
      await api.updateAgent(agent.id, { triggers: newTriggers });
      qc.invalidateQueries({ queryKey: workspaceKeys.agents(wsId) });
      toast.success("触发器已删除");
      setShowDeleteConfirm(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除触发器失败");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTriggerType("on_assign");
    setCronExpression("");
    setSelectedTimezone("Asia/Shanghai");
    setPromptText("");
    setCustomCron(false);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">触发器</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            配置数字员工在什么情况下自动开始工作。
          </p>
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={openAddDialog}
          disabled={saving}
        >
          <Plus className="h-3 w-3" />
          添加触发器
        </Button>
      </div>

      {triggers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Clock className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">还没有配置触发器</p>
          <p className="mt-1 text-xs text-muted-foreground">
            添加触发器后，数字员工会在满足条件时自动开始工作。
          </p>
          <Button
            onClick={openAddDialog}
            size="xs"
            className="mt-3"
            disabled={saving}
          >
            <Plus className="h-3 w-3" />
            添加触发器
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {triggers.map((trigger) => {
            const config = triggerTypeConfig[trigger.type];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <div
                key={trigger.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  !trigger.enabled ? "opacity-50" : ""
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{config.label}</span>
                    {!trigger.enabled && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        已禁用
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {config.description}
                  </div>
                  {trigger.type === "scheduled" && trigger.cron && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="font-mono">{trigger.cron}</span>
                      {trigger.timezone && (
                        <>
                          <span>·</span>
                          <span>{trigger.timezone}</span>
                        </>
                      )}
                    </div>
                  )}
                  {trigger.type === "scheduled" && trigger.prompt && (
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      提示词：{trigger.prompt}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleToggleTrigger(trigger.id)}
                    disabled={saving}
                    className="text-muted-foreground"
                  >
                    {trigger.enabled ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowDeleteConfirm(trigger.id)}
                    disabled={saving}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Trigger Dialog */}
      {showAddDialog && (
        <Dialog open onOpenChange={(v) => { if (!v) { resetForm(); setShowAddDialog(false); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm">添加触发器</DialogTitle>
              <DialogDescription className="text-xs">
                选择触发器类型并配置相关参数。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Trigger Type Selection */}
              <div className="space-y-2">
                <Label className="text-xs">触发器类型</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(triggerTypeConfig) as [AgentTriggerType, typeof triggerTypeConfig.on_assign][])
                    .filter(([type]) => type !== "on_mention") // on_mention is always enabled, don't allow adding
                    .map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => setTriggerType(type)}
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                            triggerType === type
                              ? "border-primary bg-primary/5"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{config.label}</div>
                            <div className="text-xs text-muted-foreground">{config.description}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Scheduled Trigger Options */}
              {triggerType === "scheduled" && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Cron 表达式</Label>
                    <Select
                      value={customCron ? "custom" : (cronExpression || undefined)}
                      onValueChange={(val) => {
                        if (val && val !== "custom") {
                          setCustomCron(false);
                          setCronExpression(val);
                        } else if (val === "custom") {
                          setCustomCron(true);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择预设或自定义" />
                      </SelectTrigger>
                      <SelectContent>
                        {cronPresets.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">自定义 Cron 表达式</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {customCron && (
                    <div className="space-y-2">
                      <Label className="text-xs">自定义 Cron</Label>
                      <Input
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                        placeholder="例如：0 9 * * *"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        格式：分 时 日 月 周
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">时区</Label>
                    <Select value={selectedTimezone} onValueChange={(val) => { if (val) setSelectedTimezone(val); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">触发提示词</Label>
                    <Textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="触发时发送给数字员工的提示词..."
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => { resetForm(); setShowAddDialog(false); }}>
                取消
              </Button>
              <Button onClick={handleAddTrigger} disabled={saving}>
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open onOpenChange={(v) => { if (!v) setShowDeleteConfirm(null); }}>
          <DialogContent className="max-w-sm" showCloseButton={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <DialogHeader className="flex-1 gap-1">
                <DialogTitle className="text-sm font-semibold">删除这个触发器？</DialogTitle>
                <DialogDescription className="text-xs">
                  此操作不可撤销。数字员工将不再响应此触发条件。
                </DialogDescription>
              </DialogHeader>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteTrigger(showDeleteConfirm)}
                disabled={saving}
              >
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
