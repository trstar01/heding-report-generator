import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } }
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { resumeText, inputs } = req.body;
    const i = inputs;

    const targetTypeDesc = {
      startup: '스타트업(시리즈 B~D, IPO 준비 단계) 우선',
      large: '대기업 금융사 우선',
      foreign: '외국계 금융기관 우선',
      mixed: '스타트업 + 대기업 병행',
      any: '업종 무관'
    }[i.targetCompanyType] || i.targetCompanyType || '미정';

    const trimmedResume = (resumeText || '').length > 25000 ? resumeText.slice(0, 25000) : (resumeText || '이력서 미첨부');

    const prompt = `당신은 HEDING의 시니어 헤드헌터입니다. 아래 후보자 정보를 바탕으로 이직 진단 리포트 데이터를 JSON으로 생성하세요.

## 후보자 정보
- 이름: ${i.candidateName}
- 현 소속: ${i.currentCompany}
- 직급: ${i.currentTitle}
- 경력: ${i.careerYears}
- 현재 연봉: ${i.currentSalary || '미확인'}
- 자격증: ${i.certifications || '없음'}
- 이직 목표: ${i.targetRole || '미정'}
- 타깃 기업: ${targetTypeDesc}
- 목표 처우: ${i.targetSalary || '미정'}
- 이직 기간: ${i.jobSearchPeriod || '미정'}
- 필수 조건: ${i.mustHave || '없음'}

## 이력서 원문 (텍스트 추출본)
${trimmedResume}

## 사전 설문 응답 (신청자가 직접 작성)
${i.surveyContent || '설문 내용 없음'}

## 유선 상담 내용 (컨설턴트가 직접 입력)
${i.consultContent || '상담 내용 없음'}

## HEDING 시장 데이터 (연봉 수치는 반드시 이 범위 내에서만 제시)
- 대기업 금융지주 팀장급: 1.5~2.0억
- 대기업 금융지주 임원급: 2.0~2.5억
- 외국계 금융기관: 0.9~1.5억 (RSU 가능)
- 중견기업 팀장급: 0.9~1.3억
- 스타트업: 0.8~1.2억 + RSU/스톡옵션

## 공개 통계 (출처가 명확한 것만 사용 가능)
- 회계사 직군 2024년 연봉 인상률: 11~14% (잡플래닛 127만건 고용보험 연동 데이터)
- 이직 시 희망 연봉 인상률 평균: 11.8% (잡코리아 1,088명 설문 2025)

다음 JSON을 생성하세요. 마크다운 없이 순수 JSON만 응답:

{
  "grade": "A+ 또는 A 또는 B+ 등 (후보자 경쟁력 기반)",
  "gradeSummary": "종합 경쟁력 한 문단 (2~3줄, 구체적 강점 포함)",
  "kpis": [
    {"label": "현재 처우", "value": "${i.currentSalary || '-'}", "sub": "기본급 기준"},
    {"label": "시장 저평가", "value": "~X0%", "sub": "구조적 저평가"},
    {"label": "현실 협상 목표", "value": "X~X억", "sub": "즉시 이직 시"},
    {"label": "이직 타이밍", "value": "지금", "sub": "구체적 이유 한 줄"}
  ],
  "verdictTitle": "핵심 진단 제목 (15자 이내)",
  "verdictBody": "핵심 진단 본문 (3~4줄, 설문·상담 내용 반영)",
  "undervaluation": "~X0%",
  "timingLabel": "지금",
  "timingDesc": "이유 한 줄",
  "strengths": [
    {"title": "강점 제목", "desc": "구체적 설명 (이력서 근거)"},
    {"title": "강점 제목", "desc": "구체적 설명"},
    {"title": "강점 제목", "desc": "구체적 설명"},
    {"title": "강점 제목", "desc": "구체적 설명"}
  ],
  "weaknesses": [
    {"title": "보완점 제목", "desc": "구체적 설명 (설문·상담 우려 반영)"},
    {"title": "보완점 제목", "desc": "구체적 설명"},
    {"title": "보완점 제목", "desc": "구체적 설명"},
    {"title": "보완점 제목", "desc": "구체적 설명"}
  ],
  "positioningTitle": "핵심 포지션 제목",
  "positioningDesc": "포지셔닝 설명 (2~3줄, 이력서 근거)",
  "selfIdentity": "후보자가 인식하는 본인 정체성 (설문 기반)",
  "selfIdentityDesc": "설명 (1~2줄)",
  "actualIdentity": "HEDING이 분석한 실제 역량 폭",
  "actualIdentityDesc": "설명 (1~2줄)",
  "fitTable": [
    {"industry": "업종", "role": "적합 직종", "point": "핵심 포인트", "desc": "타깃 기업·설문 반영"},
    {"industry": "업종", "role": "적합 직종", "point": "핵심 포인트", "desc": "부연 설명"},
    {"industry": "업종", "role": "적합 직종", "point": "핵심 포인트", "desc": "부연 설명"},
    {"industry": "업종", "role": "적합 직종", "point": "핵심 포인트", "desc": "부연 설명"}
  ],
  "marketVerdict": "시장 가치 판단 제목",
  "marketVerdictDesc": "시장 가치 판단 설명 (HEDING 데이터 범위 내 수치만)",
  "marketRange": "X~X억",
  "negotiationTarget": "X~X억",
  "salaryBands": [
    {"label": "현재 처우 (확인값)", "left": 0, "width": 22, "color": "rgba(255,255,255,.15)", "range": "${i.currentSalary || '-'} ◀", "highlight": true},
    {"label": "스타트업 CFO·재무총괄", "left": 8, "width": 24, "color": "rgba(255,255,255,.25)", "range": "0.8 – 1.2억 +RSU"},
    {"label": "중견·외국계 팀장급", "left": 12, "width": 32, "color": "rgba(255,255,255,.35)", "range": "0.9 – 1.5억"},
    {"label": "대기업 금융지주 팀장급", "left": 30, "width": 40, "color": "var(--gold2)", "range": "1.5 – 2.0억 ★목표"},
    {"label": "대기업 금융지주 임원급", "left": 50, "width": 50, "color": "rgba(255,255,255,.3)", "range": "2.0 – 2.5억+"}
  ],
  "negotiation": [
    {"position": "포지션명", "company": "대상 기업 유형", "level": "레벨", "range": "X~X억", "tip": "협상 팁"},
    {"position": "포지션명", "company": "대상 기업 유형", "level": "레벨", "range": "X~X억", "tip": "협상 팁"},
    {"position": "포지션명", "company": "대상 기업 유형", "level": "레벨", "range": "X~X억", "tip": "협상 팁"}
  ],
  "timingTitle": "이직 타이밍 제목",
  "timingBody": "타이밍 설명 (이직 활동 기간 반영)",
  "timeline": [
    {"period": "NOW · ${i.dateShort}", "title": "이직 준비 시작", "desc": "포지셔닝 확립·이력서 재구성"},
    {"period": "1~2개월", "title": "집중 지원", "desc": "타깃 기업 지원·헤드헌터 컨택"},
    {"period": "2~4개월", "title": "면접·협상", "desc": "처우 협상·의사결정"},
    {"period": "${i.jobSearchPeriod || '하반기'}", "title": "이직 완료 목표", "desc": "복수 오퍼 비교 후 결정"}
  ],
  "stratLeftTitle": "주요 타깃 전략",
  "stratLeft": [
    {"tag": "핵심", "type": "do", "title": "전략 제목", "body": "설명 (설문·상담 근거)"},
    {"tag": "필수", "type": "do", "title": "전략 제목", "body": "설명"},
    {"tag": "중요", "type": "focus", "title": "전략 제목", "body": "설명"},
    {"tag": "주의", "type": "warn", "title": "전략 제목", "body": "설명"}
  ],
  "stratRightTitle": "보완 전략",
  "stratRight": [
    {"tag": "필수", "type": "do", "title": "전략 제목", "body": "설명"},
    {"tag": "필수", "type": "do", "title": "전략 제목", "body": "설명"},
    {"tag": "준비", "type": "focus", "title": "전략 제목", "body": "설명"},
    {"tag": "체크", "type": "warn", "title": "전략 제목", "body": "설명"}
  ],
  "planIntro": "액션 플랜 서두 (1~2줄)",
  "phases": [
    {"title": "1단계 · 정비", "period": "D+1 ~ D+30 · 방향 확립", "tasks": [
      {"title": "과제", "desc": "설명"}, {"title": "과제", "desc": "설명"},
      {"title": "과제", "desc": "설명"}, {"title": "과제", "desc": "설명"}
    ]},
    {"title": "2단계 · 실행", "period": "D+31 ~ D+60 · 집중 지원", "tasks": [
      {"title": "과제", "desc": "설명"}, {"title": "과제", "desc": "설명"},
      {"title": "과제", "desc": "설명"}, {"title": "과제", "desc": "설명"}
    ]},
    {"title": "3단계 · 결정", "period": "D+61 ~ D+90 · 협상·완료", "tasks": [
      {"title": "과제", "desc": "설명"}, {"title": "과제", "desc": "설명"},
      {"title": "과제", "desc": "설명"}, {"title": "과제", "desc": "설명"}
    ]}
  ],
  "checklistNow": [
    {"title": "항목", "sub": "설명"}, {"title": "항목", "sub": "설명"},
    {"title": "항목", "sub": "설명"}, {"title": "항목", "sub": "설명"}
  ],
  "checklistLong": [
    {"title": "항목", "sub": "설명"}, {"title": "항목", "sub": "설명"},
    {"title": "항목", "sub": "설명"}, {"title": "항목", "sub": "설명"}
  ],
  "hhIntro": "${i.candidateName} 님, 상담 후 리포트를 정리하면서 솔직하게 적겠습니다.",
  "hhPoints": [
    {"label": "Q1", "title": "포인트 제목", "text": "내용 (설문·상담 직접 반영, 헤드헌터 현장 언어)"},
    {"label": "Q2", "title": "포인트 제목", "text": "내용"},
    {"label": "Q3", "title": "포인트 제목", "text": "내용"},
    {"label": "Q4", "title": "포인트 제목", "text": "내용"}
  ],
  "hhFinal": "마지막 코멘트 (격려 + 핵심 액션)",
  "consultSummary": [],
  "inputs": {}
}

절대 규칙:
1. 모든 내용은 한국어로 작성. 오타·맞춤법 오류는 자동 교정.
2. 연봉·통계 수치는 HEDING 시장 데이터와 공개 통계 범위 내에서만 사용. 임의 수치 생성 금지.
3. 이력서에 없는 경력·자격·프로젝트 추측 금지. 명시된 사실만 근거로 사용.
4. 설문·상담 내용은 verdictBody, weaknesses, positioningDesc, fitTable, stratLeft/Right, hhPoints, consultSummary 전반에 구체적으로 반영.
5. 설문/상담이 비어있으면 이력서 기반으로만 작성.
6. hhPoints는 실제 헤드헌터 현장 언어로 (AI 상투어 금지).
7. consultSummary는 상담 내용이 있을 때만 작성. 없으면 [].
8. inputs 필드는 {} 로 남겨둘 것.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;

    let analysis;
    try {
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(clean);
    } catch {
      return res.status(500).json({ error: '리포트 데이터 파싱 실패: ' + content.substring(0, 200) });
    }

    analysis.inputs = inputs;
    return res.status(200).json(analysis);

  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message || '리포트 생성 중 오류' });
  }
}
