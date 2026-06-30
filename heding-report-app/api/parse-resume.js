import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { pdfBase64, filename } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'PDF 데이터가 없습니다' });

    // Claude로 PDF 텍스트 추출 + 핵심 정보 파싱
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64
            }
          },
          {
            type: 'text',
            text: `이 이력서 PDF에서 다음 정보를 추출해주세요. JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만.

{
  "text": "이력서 전체 텍스트 (중요 내용 위주로 요약)",
  "extracted": {
    "name": "이름 (한글)",
    "company": "현 소속 회사명",
    "title": "직급/직위",
    "career": "총 경력 (예: 8년 10개월)",
    "salary": "연봉 정보 (있다면)",
    "certifications": "자격증 목록",
    "education": "최종 학력",
    "keySkills": "핵심 역량/기술 키워드 3~5개",
    "notableProjects": "주요 프로젝트/경력 2~3개 요약"
  }
}`
          }
        ]
      }]
    });

    const content = response.content[0].text;

    // JSON 파싱
    let parsed;
    try {
      // 마크다운 코드블록 제거 후 파싱
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { text: content, extracted: {} };
    }

    return res.status(200).json({
      text: parsed.text || content,
      extracted: parsed.extracted || {}
    });

  } catch (err) {
    console.error('Parse error:', err);
    return res.status(500).json({ error: err.message || '이력서 파싱 중 오류가 발생했습니다' });
  }
}
