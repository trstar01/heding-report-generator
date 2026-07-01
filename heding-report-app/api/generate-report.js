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

다음
