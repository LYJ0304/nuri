import Link from 'next/link';

import { HealthCheck } from './health-check';

const recentRecords = [
  { name: '초기 상담 기록', client: '김민서', date: '오늘, 10:24', status: '요약 완료' },
  { name: '2차 상담 기록', client: '박준호', date: '어제, 16:40', status: '처리 중' },
  { name: '경과 관찰 기록', client: '이서윤', date: '7월 10일', status: '요약 완료' },
];

function Icon({ name }: { name: 'document' | 'sparkle' | 'folder' | 'arrow' | 'plus' }) {
  const paths = {
    document: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 12h5M10 16h5" /></>,
    sparkle: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></>,
    folder: <path d="M3 6.5h7l2 2h9v10.5H3z" />,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

export default function Home() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Nuri 홈">
          <span className="brand-mark">N</span>
          <span>Nuri</span>
        </Link>

        <nav className="nav" aria-label="주 메뉴">
          <a className="nav-item active" href="#"><Icon name="folder" />홈</a>
          <a className="nav-item" href="#"><Icon name="document" />상담 기록</a>
          <a className="nav-item" href="#"><Icon name="sparkle" />AI 요약</a>
        </nav>

        <div className="sidebar-bottom">
          <HealthCheck />
          <div className="profile">
            <span className="avatar">이</span>
            <span><strong>이상담</strong><small>상담사</small></span>
            <button aria-label="프로필 메뉴">•••</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">WORKSPACE</span><h1>좋은 아침이에요, 이상담님</h1></div>
          <Link className="primary-button" href="/records/new"><Icon name="plus" />새 상담 기록</Link>
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <span className="hero-badge"><Icon name="sparkle" />AI 상담 요약</span>
            <h2>기록은 간결하게,<br />상담에는 더 집중하세요.</h2>
            <p>상담 기록을 업로드하면 Nuri가 핵심 내용과 후속 조치를 구조화해 정리해 드려요.</p>
            <a className="hero-action" href="#">기록 요약하기 <Icon name="arrow" /></a>
          </div>
          <div className="summary-preview" aria-hidden="true">
            <div className="preview-header"><span /><span /><span /></div>
            <div className="preview-label">SESSION SUMMARY</div>
            <div className="preview-line wide" /><div className="preview-line" />
            <div className="preview-section"><i />주요 상담 내용</div>
            <div className="preview-line wide" /><div className="preview-line medium" />
            <div className="preview-section"><i />다음 상담 확인 사항</div>
            <div className="preview-pills"><span>수면 기록</span><span>정서 변화</span></div>
          </div>
        </section>

        <section className="overview-grid">
          <article className="stat-card"><span>이번 달 상담</span><strong>24<small>건</small></strong><em>지난달보다 12% 증가</em></article>
          <article className="stat-card"><span>요약 완료</span><strong>19<small>건</small></strong><em>평균 처리 시간 18초</em></article>
          <article className="stat-card"><span>검토 필요</span><strong>3<small>건</small></strong><em className="muted">확인이 필요한 기록</em></article>
        </section>

        <section className="records-section">
          <div className="section-heading"><div><h2>최근 상담 기록</h2><p>최근 업로드하거나 요약한 기록이에요.</p></div><a href="#">전체 보기 <Icon name="arrow" /></a></div>
          <div className="records-table">
            {recentRecords.map((record) => (
              <a className="record-row" href="#" key={record.name}>
                <span className="record-icon"><Icon name="document" /></span>
                <span className="record-name"><strong>{record.name}</strong><small>{record.client}</small></span>
                <span className="record-date">{record.date}</span>
                <span className={`record-status ${record.status === '처리 중' ? 'processing' : ''}`}>{record.status}</span>
                <Icon name="arrow" />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
