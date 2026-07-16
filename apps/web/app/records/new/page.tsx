'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useCounselingStore } from '../../../stores/counseling-store';

function Icon({ name }: { name: 'back' | 'lock' }) {
  const paths = {
    back: <><path d="M19 12H5M10 7l-5 5 5 5" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

export default function NewRecordPage() {
  const router = useRouter();
  const addClient = useCounselingStore((state) => state.addClient);
  const setSessionDraft = useCounselingStore((state) => state.setSessionDraft);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '');
    const client = await addClient({
      name: value('clientName'), birthDate: value('birthDate'), gender: value('gender'), occupation: value('occupation'), phoneNumber: value('phoneNumber'), address: value('address'),
      protectionCategory: value('protectionCategory'), householdType: value('householdType'), hasDisability: value('hasDisability'), longTermCare: value('longTermCare'), emergencyContact: value('emergencyContact'),
      housingType: value('housingType'), housingOwnership: value('housingOwnership'), familyRelationship: value('familyRelationship'), familyName: value('familyName'), familyGender: value('familyGender'),
      familyBirthDate: value('familyBirthDate'), familyOccupation: value('familyOccupation'), familyCohabitation: value('familyCohabitation'), familyNotes: value('familyNotes'),
    });
    const sessionNumber = Number(value('sessionNumber'));
    setSessionDraft({ clientId: client.id, title: value('title'), sessionDate: value('sessionDate'), sessionType: value('sessionType'), sessionNumber: Number.isFinite(sessionNumber) && sessionNumber > 0 ? sessionNumber : undefined });
    router.push(`/records/write?clientId=${client.id}`);
  }

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
          <h1>새 상담 등록</h1>
          <p>상담과 내담자 정보를 먼저 등록해 주세요. 등록 후 상담 내용을 작성할 수 있어요.</p>
        </div>

        <form className="record-form" onSubmit={handleSubmit}>
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
            <div className="form-card-heading"><span>2</span><div><h2>클라이언트 정보</h2><p>상담을 진행하고 있는 클라이언트의 정보를 입력해 주세요.</p></div></div>
            <div className="form-grid">
              <label className="field"><span>생년월일</span><input name="birthDate" type="date" /></label>
              <label className="field"><span>성별</span><select name="gender" defaultValue=""><option value="" disabled>성별 선택</option><option value="male">남성</option><option value="female">여성</option><option value="other">기타</option><option value="not-disclosed">응답하지 않음</option></select></label>
              <label className="field"><span>직업</span><input name="occupation" placeholder="직업 입력" /></label>
              <label className="field"><span>전화번호</span><input name="phoneNumber" type="tel" placeholder="010-0000-0000" /></label>
              <label className="field full"><span>주소</span><input name="address" autoComplete="street-address" placeholder="주소 입력" /></label>
              <label className="field"><span>보호구분</span><select name="protectionCategory" defaultValue=""><option value="" disabled>보호구분 선택</option><option value="customized-benefit">맞춤형 급여</option><option value="conditional-recipient">조건부 수급</option><option value="near-poverty">차상위</option><option value="low-income">저소득</option><option value="general">일반</option></select></label>
              <label className="field"><span>가구유형</span><select name="householdType" defaultValue=""><option value="" disabled>가구유형 선택</option><option value="single">1인 가구</option><option value="couple">부부 가구</option><option value="single-parent">한부모 가구</option><option value="grandparent-grandchild">조손 가구</option><option value="multicultural">다문화 가구</option><option value="other">기타</option></select></label>
              <label className="field"><span>장애 유무</span><select name="hasDisability" defaultValue=""><option value="" disabled>장애 유무 선택</option><option value="no">없음</option><option value="yes">있음</option></select></label>
              <label className="field"><span>장기요양</span><select name="longTermCare" defaultValue=""><option value="" disabled>장기요양 상태 선택</option><option value="none">해당 없음</option><option value="applied">신청 중</option><option value="eligible">등급 있음</option></select></label>
              <label className="field full"><span>긴급 연락처</span><input name="emergencyContact" type="tel" placeholder="010-0000-0000" /></label>
              <fieldset className="field-group full">
                <legend>주거 현황</legend>
                <div className="housing-grid">
                  <label className="field"><span>형태</span><select name="housingType" defaultValue=""><option value="" disabled>주거 형태 선택</option><option value="apartment">아파트</option><option value="detached-house">단독주택</option><option value="multi-family-house">다세대·연립주택</option><option value="officetel">오피스텔</option><option value="goshiwon">고시원</option><option value="temporary">임시 거처</option><option value="other">기타</option></select></label>
                  <label className="field"><span>소유</span><select name="housingOwnership" defaultValue=""><option value="" disabled>소유 형태 선택</option><option value="owned">자가</option><option value="jeonse">전세</option><option value="monthly-rent">월세</option><option value="free">무상 거주</option><option value="facility">시설 거주</option><option value="other">기타</option></select></label>
                </div>
              </fieldset>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-heading"><span>3</span><div><h2>가족사항</h2><p>클라이언트 가족의 기본 정보와 동거 여부를 입력해 주세요.</p></div></div>
            <div className="form-grid">
              <label className="field"><span>관계</span><input name="familyRelationship" placeholder="예: 배우자, 자녀" /></label>
              <label className="field"><span>이름</span><input name="familyName" placeholder="이름 입력" /></label>
              <label className="field"><span>성별</span><select name="familyGender" defaultValue=""><option value="" disabled>성별 선택</option><option value="male">남성</option><option value="female">여성</option><option value="other">기타</option><option value="not-disclosed">응답하지 않음</option></select></label>
              <label className="field"><span>생년월일</span><input name="familyBirthDate" type="date" /></label>
              <label className="field"><span>직업</span><input name="familyOccupation" placeholder="직업 입력" /></label>
              <label className="field"><span>동거여부</span><select name="familyCohabitation" defaultValue=""><option value="" disabled>동거여부 선택</option><option value="yes">동거</option><option value="no">비동거</option></select></label>
              <label className="field full"><span>특이사항</span><textarea className="compact-textarea" name="familyNotes" rows={4} placeholder="건강 상태, 관계 특성 등 참고할 내용을 입력해 주세요." /></label>
            </div>
          </section>

          <div className="form-actions">
            <Link className="secondary-button" href="/">취소</Link>
            <button className="primary-button" type="submit">상담 정보 등록</button>
          </div>
        </form>
      </div>
    </main>
  );
}
