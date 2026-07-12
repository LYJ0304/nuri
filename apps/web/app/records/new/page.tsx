import Link from 'next/link';

function Icon({ name }: { name: 'back' | 'upload' | 'sparkle' | 'lock' }) {
  const paths = {
    back: <><path d="M19 12H5M10 7l-5 5 5 5" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 15v5h14v-5" /></>,
    sparkle: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

export default function NewRecordPage() {
  return (
    <main className="record-page">
      <header className="record-header">
        <Link className="brand" href="/" aria-label="Nuri 홈">
          <span className="brand-mark">N</span><span>Nuri</span>
        </Link>
        <span className="secure-label"><Icon name="lock" />안전하게 보호되는 기록</span>
      </header>

      <div className="record-container">
        <Link className="back-link" href="/"><Icon name="back" />홈으로 돌아가기</Link>
        <div className="record-title">
          <span className="eyebrow">NEW RECORD</span>
          <h1>새 상담 기록</h1>
          <p>상담 정보를 입력하고 기록을 추가해 주세요. 저장 후 AI 요약을 생성할 수 있어요.</p>
        </div>

        <form className="record-form">
          <section className="form-card">
            <div className="form-card-heading"><span>1</span><div><h2>기본 정보</h2><p>상담을 구분하기 위한 정보를 입력해 주세요.</p></div></div>
            <div className="form-grid">
              <label className="field full"><span>기록 제목</span><input name="title" placeholder="예: 7월 3주차 정기 상담" required /></label>
              <label className="field"><span>내담자 이름</span><input name="clientName" placeholder="이름 입력" required /></label>
              <label className="field"><span>상담 일시</span><input name="sessionDate" type="datetime-local" required /></label>
              <label className="field"><span>상담 유형</span><select name="sessionType" defaultValue="individual"><option value="individual">개인 상담</option><option value="group">집단 상담</option><option value="family">가족 상담</option><option value="other">기타</option></select></label>
              <label className="field"><span>상담 회차</span><input name="sessionNumber" type="number" min="1" placeholder="1" /></label>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-heading"><span>2</span><div><h2>상담 기록</h2><p>상담 내용을 직접 입력하거나 텍스트 파일을 첨부해 주세요.</p></div></div>
            <label className="field"><span>상담 원문</span><textarea name="transcript" rows={12} placeholder={'상담자: 오늘은 어떤 이야기를 나누고 싶으신가요?\n내담자: 최근 수면 문제로 어려움을 겪고 있어요.'} required /><small>화자를 구분해 입력하면 더 정확하게 요약할 수 있어요.</small></label>
            <div className="form-divider"><span>또는</span></div>
            <label className="upload-box">
              <input type="file" name="recordFile" accept=".txt,.md,.doc,.docx" />
              <span className="upload-icon"><Icon name="upload" /></span>
              <strong>파일을 선택하거나 여기로 끌어오세요</strong>
              <small>TXT, MD, DOC, DOCX · 최대 10MB</small>
            </label>
          </section>

          <section className="summary-option">
            <span className="option-icon"><Icon name="sparkle" /></span>
            <div><strong>저장 후 AI 요약 생성</strong><p>핵심 상담 내용, 개입 사항과 다음 상담 확인 사항을 자동으로 정리해요.</p></div>
            <label className="switch"><input type="checkbox" name="generateSummary" defaultChecked /><span /></label>
          </section>

          <div className="form-actions">
            <Link className="secondary-button" href="/">취소</Link>
            <button className="primary-button" type="submit">상담 기록 저장</button>
          </div>
        </form>
      </div>
    </main>
  );
}
