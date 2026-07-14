'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { useCounselingStore } from '../../../stores/counseling-store';

function Icon({ name }: { name: 'back' | 'lock' | 'sparkle' | 'upload' | 'user' }) {
  const paths = {
    back: <><path d="M19 12H5M10 7l-5 5 5 5" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    sparkle: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 15v5h14v-5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function WriteRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedClientId = searchParams.get('clientId') ?? 'kim-minseo';
  const client = useCounselingStore((state) => state.clients.find((item) => item.id === requestedClientId));
  const allRecords = useCounselingStore((state) => state.records);
  const records = allRecords.filter((record) => record.clientId === requestedClientId);
  const sessionDraft = useCounselingStore((state) => state.sessionDraft?.clientId === requestedClientId ? state.sessionDraft : null);
  const addRecord = useCounselingStore((state) => state.addRecord);
  const setSessionDraft = useCounselingStore((state) => state.setSessionDraft);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '');
    const sessionNumber = sessionDraft?.sessionNumber ?? records.length + 1;
    addRecord({
      clientId: client.id, title: value('title'), sessionDate: value('sessionDate'), sessionType: value('sessionType'), sessionNumber,
      presentingConcern: value('presentingConcern'), sessionContent: value('sessionContent'), counselorObservation: value('counselorObservation'), intervention: value('intervention'),
      riskLevel: value('riskLevel') as 'none' | 'attention' | 'urgent', followUpPlan: value('followUpPlan'), summaryStatus: form.get('generateSummary') ? 'pending' : 'not-requested',
    });
    setSessionDraft(null);
    router.push(`/clients/${client.id}`);
  }

  if (!client) {
    return <main className="record-page"><div className="record-container empty-state"><h1>내담자를 찾을 수 없습니다.</h1><p>내담자를 먼저 등록한 뒤 상담 기록을 작성해 주세요.</p><Link className="primary-button" href="/records/new">내담자 등록하기</Link></div></main>;
  }

  return (
    <main className="record-page">
      <header className="record-header">
        <Link className="brand" href="/" aria-label="Nuri 홈"><span className="brand-mark">N</span><span>Nuri</span></Link>
        <span className="secure-label"><Icon name="lock" />안전하게 보호되는 기록</span>
      </header>

      <div className="record-container write-record-container">
        <Link className="back-link" href={`/clients/${client.id}`}><Icon name="back" />{client.name} 상담 기록으로 돌아가기</Link>
        <div className="record-title">
          <span className="eyebrow">WRITE SESSION NOTE</span>
          <h1>상담 기록 작성</h1>
          <p>이번 회기에서 나눈 내용과 상담자의 개입을 구체적으로 기록해 주세요.</p>
        </div>

        <section className="selected-client-card">
          <span className="selected-client-avatar">{client.name.slice(0, 1)}</span>
          <div><small>선택된 내담자</small><strong>{client.name}</strong><p>{records.length + 1}회차 상담 작성</p></div>
          <span className="selected-client-status"><Icon name="user" />상담 진행 중</span>
        </section>

        <form className="record-form" onSubmit={handleSubmit}>
          <section className="form-card session-record-card">
            <div className="form-card-heading"><span>1</span><div><h2>회기 정보</h2><p>작성할 상담 기록의 기본 정보를 확인해 주세요.</p></div></div>
            <div className="form-grid">
              <label className="field full"><span>기록 제목</span><input name="title" defaultValue={sessionDraft?.title} placeholder="예: 7월 4주차 정기 상담" required /></label>
              <label className="field"><span>상담 일시</span><input name="sessionDate" type="datetime-local" defaultValue={sessionDraft?.sessionDate} required /></label>
              <label className="field"><span>상담 유형</span><select name="sessionType" defaultValue={sessionDraft?.sessionType ?? 'individual'}><option value="individual">개인 상담</option><option value="group">집단 상담</option><option value="family">가족 상담</option><option value="other">기타</option></select></label>
            </div>
          </section>

          <section className="form-card session-record-card">
            <div className="form-card-heading"><span>2</span><div><h2>상담 내용</h2><p>내담자와 나눈 내용 및 상담자의 개입을 기록해 주세요.</p></div></div>
            <div className="session-record-grid">
              <label className="field"><span>주호소 및 상담 주제 <b>필수</b></span><textarea name="presentingConcern" required rows={7} placeholder="내담자가 호소한 어려움과 이번 상담에서 다룬 핵심 주제를 작성해 주세요." /></label>
              <label className="field"><span>상담 내용 <b>필수</b></span><textarea name="sessionContent" required rows={10} placeholder="상담 중 내담자가 표현한 생각과 감정, 주요 대화 내용을 시간의 흐름에 따라 기록해 주세요." /></label>
              <div className="record-detail-grid">
                <label className="field"><span>상담자 관찰</span><textarea className="medium-textarea" name="counselorObservation" rows={5} placeholder="정서, 행동, 태도 등 상담 중 관찰한 내용을 기록해 주세요." /></label>
                <label className="field"><span>개입 및 상담자 의견</span><textarea className="medium-textarea" name="intervention" rows={5} placeholder="사용한 상담 기법, 제공한 정보와 상담자의 판단을 기록해 주세요." /></label>
              </div>
              <fieldset className="risk-fieldset">
                <legend>위기 수준</legend>
                <p>이번 상담에서 확인된 자·타해 또는 긴급 개입 위험 수준을 선택해 주세요.</p>
                <div className="risk-options">
                  <label><input type="radio" name="riskLevel" value="none" defaultChecked /><span><strong>해당 없음</strong><small>위기 징후가 확인되지 않음</small></span></label>
                  <label><input type="radio" name="riskLevel" value="attention" /><span><strong>주의</strong><small>지속적인 관찰이 필요함</small></span></label>
                  <label><input type="radio" name="riskLevel" value="urgent" /><span><strong>긴급</strong><small>즉각적인 개입이 필요함</small></span></label>
                </div>
              </fieldset>
              <label className="field"><span>다음 상담 계획</span><textarea className="compact-textarea" name="followUpPlan" rows={4} placeholder="다음 회기에서 확인할 내용, 과제와 향후 개입 계획을 작성해 주세요." /></label>
              <label className="upload-box record-upload">
                <input type="file" name="attachments" multiple accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.m4a,.mp3" />
                <span className="upload-icon"><Icon name="upload" /></span><strong>상담 관련 파일 첨부</strong><small>문서, 이미지, 음성 파일 · 파일당 최대 20MB</small>
              </label>
            </div>
          </section>

          <section className="summary-option">
            <span className="option-icon"><Icon name="sparkle" /></span>
            <div><strong>저장 후 AI 요약 생성</strong><p>핵심 상담 내용, 개입 사항과 다음 상담 확인 사항을 자동으로 정리해요.</p></div>
            <label className="switch"><input type="checkbox" name="generateSummary" defaultChecked /><span /></label>
          </section>

          <div className="form-actions">
            <Link className="secondary-button" href={`/clients/${client.id}`}>취소</Link>
            <button className="primary-button" type="submit">상담 기록 저장</button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function WriteRecordPage() {
  return <Suspense fallback={<main className="record-page"><div className="record-container empty-state"><p>상담 기록을 준비하고 있습니다.</p></div></main>}><WriteRecordForm /></Suspense>;
}
