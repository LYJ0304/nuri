'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useCounselingStore } from '../../../stores/counseling-store';

const labels: Record<string, string> = {
  female: '여성', male: '남성', other: '기타', general: '일반', 'single-parent': '한부모 가구', single: '1인 가구', couple: '부부 가구', apartment: '아파트', 'monthly-rent': '월세', yes: '동거', no: '비동거',
};

function Icon({ name }: { name: 'back' | 'calendar' | 'document' | 'phone' | 'plus' | 'sparkle' | 'user' }) {
  const paths = {
    back: <><path d="M19 12H5M10 7l-5 5 5 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    document: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 12h5M10 16h5" /></>,
    phone: <path d="M6.6 3.5 9 7.8 6.9 9.4c1.4 3 3.7 5.3 6.7 6.7l1.6-2.1 4.3 2.4-.8 3c-.2.8-1 1.4-1.9 1.3C9.6 20 4 14.4 3.3 7.2c-.1-.9.5-1.7 1.3-1.9z" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    sparkle: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}

export default function ClientRecordsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const client = useCounselingStore((state) => state.clients.find((item) => item.id === clientId));
  const allRecords = useCounselingStore((state) => state.records);
  const records = allRecords.filter((record) => record.clientId === clientId).sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

  if (!client) return <main className="client-page"><div className="record-container empty-state"><h1>내담자를 찾을 수 없습니다.</h1><Link className="primary-button" href="/">홈으로 돌아가기</Link></div></main>;
  const latest = records[0];

  return (
    <main className="client-page">
      <header className="record-header"><Link className="brand" href="/"><span className="brand-mark">N</span><span>Nuri</span></Link><Link className="client-new-record" href={`/records/write?clientId=${client.id}`}><Icon name="plus" />상담 기록 작성</Link></header>
      <div className="client-container">
        <Link className="back-link" href="/"><Icon name="back" />홈으로 돌아가기</Link>
        <section className="client-hero"><div className="client-avatar">{client.name.slice(0, 1)}</div><div className="client-heading"><span className="eyebrow">CLIENT RECORD</span><h1>{client.name}</h1><p>등록 상담 {records.length}건{latest ? ` · 최근 상담 ${formatDate(latest.sessionDate)}` : ''}</p></div></section>
        <div className="client-layout">
          <aside className="client-sidebar">
            <section className="client-info-card"><div className="client-card-title"><h2>기본 정보</h2><Icon name="user" /></div><dl className="client-details">
              <div><dt>생년월일</dt><dd>{client.birthDate || '-'}</dd></div><div><dt>성별</dt><dd>{labels[client.gender ?? ''] || client.gender || '-'}</dd></div><div><dt>직업</dt><dd>{client.occupation || '-'}</dd></div><div><dt>보호구분</dt><dd>{labels[client.protectionCategory ?? ''] || client.protectionCategory || '-'}</dd></div><div><dt>가구유형</dt><dd>{labels[client.householdType ?? ''] || client.householdType || '-'}</dd></div><div><dt>주거 현황</dt><dd>{[labels[client.housingType ?? ''] || client.housingType, labels[client.housingOwnership ?? ''] || client.housingOwnership].filter(Boolean).join(' · ') || '-'}</dd></div>
            </dl>{client.phoneNumber && <div className="client-contact"><Icon name="phone" /><span><small>연락처</small>{client.phoneNumber}</span></div>}</section>
            {client.familyName && <section className="client-info-card family-card"><div className="client-card-title"><h2>가족사항</h2><span>1명</span></div><div className="family-person"><span className="family-avatar">{client.familyRelationship?.slice(0, 1)}</span><div><strong>{client.familyName}</strong><p>{client.familyRelationship} · {labels[client.familyCohabitation ?? ''] || client.familyCohabitation}</p></div></div><dl className="family-details"><div><dt>직업</dt><dd>{client.familyOccupation || '-'}</dd></div><div><dt>특이사항</dt><dd>{client.familyNotes || '-'}</dd></div></dl></section>}
          </aside>
          <div className="client-records">
            <section className="client-summary-card"><span className="summary-mark"><Icon name="sparkle" /></span><div><span className="eyebrow">SESSION OVERVIEW</span><h2>{latest ? '최근 상담 기록' : '첫 상담을 기록해 주세요'}</h2><p>{latest?.sessionContent || '아직 등록된 상담 기록이 없습니다.'}</p></div><div className="summary-metric"><strong>{records.length}</strong><span>총 상담 회차</span></div></section>
            <section className="session-section"><div className="session-heading"><div><h2>상담 기록</h2><p>{client.name} 내담자와 진행한 상담을 최신순으로 확인할 수 있어요.</p></div><span><Icon name="calendar" />전체 기간</span></div>
              {records.length === 0 ? <div className="records-empty"><Icon name="document" /><strong>아직 상담 기록이 없습니다.</strong><Link href={`/records/write?clientId=${client.id}`}>첫 기록 작성하기</Link></div> : <div className="session-timeline">{records.map((record, index) => <article className="session-card" key={record.id}><div className="timeline-rail"><span>{record.sessionNumber ?? records.length - index}</span>{index < records.length - 1 && <i />}</div><div className="session-content"><div className="session-card-header"><div><span className="session-meta">{record.sessionType === 'individual' ? '개인 상담' : record.sessionType} · {record.sessionNumber ?? records.length - index}회차</span><h3>{record.title}</h3><time>{formatDate(record.sessionDate)}</time></div></div><p className="session-summary">{record.sessionContent}</p><div className="session-topics"><span>{record.presentingConcern}</span></div>{record.followUpPlan && <div className="session-follow-up"><Icon name="document" /><div><strong>다음 상담 확인 사항</strong><p>{record.followUpPlan}</p></div></div>}</div></article>)}</div>}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
