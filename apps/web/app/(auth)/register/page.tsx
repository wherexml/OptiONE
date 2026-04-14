"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@multica/core/auth";
import { useWorkspaceStore } from "@multica/core/workspace";
import { api } from "@multica/core/api";
import { setLoggedInCookie } from "@/features/auth/auth-cookie";
import { localizeAuthError } from "@/features/auth/auth-error";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@multica/ui/components/ui/card";
import { Input } from "@multica/ui/components/ui/input";
import { Button } from "@multica/ui/components/ui/button";
import { Label } from "@multica/ui/components/ui/label";
import Link from "next/link";

function RegisterPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
  const searchParams = useSearchParams();

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  // Already authenticated — redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/issues");
    }
  }, [isLoading, user, router]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = nameRef.current?.value?.trim() ?? "";
    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";
    const confirmPassword = confirmRef.current?.value ?? "";
    if (!name) {
      setError("请输入姓名");
      return;
    }
    if (!email) {
      setError("请输入邮箱");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }
    if (password.length < 8) {
      setError("密码至少需要 8 位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { token } = await api.register(name, email, password);
      localStorage.setItem("multica_token", token);
      api.setToken(token);
      setLoggedInCookie();
      const wsList = await api.listWorkspaces();
      hydrateWorkspace(wsList);
      router.push(searchParams.get("next") || "/issues");
    } catch (err) {
      setError(localizeAuthError(err, "注册失败，请稍后重试"));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>注册 OptiOne 账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="register-form" onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                ref={nameRef}
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="请输入姓名"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="请输入邮箱"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="请输入密码"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认密码</Label>
              <Input
                ref={confirmRef}
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="请再次输入密码"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            form="register-form"
            className="w-full"
            size="lg"
            disabled={submitting}
          >
            {submitting ? "注册中..." : "注册"}
          </Button>
          <p className="text-sm text-muted-foreground">
            已有账号？{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
