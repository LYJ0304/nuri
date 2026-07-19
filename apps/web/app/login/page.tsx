'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth-provider';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get('email')), String(form.get('password')));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '로그인하지 못했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand login-brand"><span className="brand-mark">N</span><span>Nuri</span></div>
        <p className="eyebrow">COUNSELOR WORKSPACE</p>
        <h1 id="login-title">상담 기록을 안전하게 시작하세요.</h1>
        <p className="login-description">등록한 상담사 계정으로 로그인해 주세요.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field"><span>이메일</span><input name="email" type="email" autoComplete="username" required /></label>
          <label className="field"><span>비밀번호</span><input name="password" type="password" autoComplete="current-password" required /></label>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <button className="primary-button login-button" disabled={loading || submitting} type="submit">{submitting ? '로그인 중…' : '로그인'}</button>
        </form>
      </section>
    </main>
  );
}
