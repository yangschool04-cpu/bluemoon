document.addEventListener('DOMContentLoaded', () => {
    const feedbackBtn = document.getElementById('feedbackBtn');
    const studentText = document.getElementById('studentText');
    const resultSection = document.getElementById('resultSection');
    const feedbackBody = document.getElementById('feedbackBody');
    
    // ✨ 설정값 (env.js 파일에서 불러옵니다) ✨
    const API_KEY = window.ENV.GEMINI_API_KEY;
    const SUPABASE_URL = window.ENV.SUPABASE_URL;
    const SUPABASE_KEY = window.ENV.SUPABASE_KEY;
    
    const supabase = (window.supabase && SUPABASE_URL && SUPABASE_URL.trim() !== '' && SUPABASE_URL !== '여기에_Supabase_URL_입력') 
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
        : null;

    feedbackBtn.addEventListener('click', async () => {
        const text = studentText.value.trim();
        
        if (text === '') {
            alert('학생의 글을 입력해주세요!');
            studentText.focus();
            return;
        }

        // 버튼 클릭 시 로딩 효과
        feedbackBtn.textContent = 'AI가 분석 중입니다... ⏳';
        feedbackBtn.disabled = true;
        resultSection.classList.add('hidden');
        resultSection.classList.remove('fade-in');

        try {
            const result = await analyzeTextWithGemini(text);
            showFeedbackResult(result);
            
            // Supabase 데이터베이스에 저장
            if (SUPABASE_URL && SUPABASE_URL !== '여기에_Supabase_URL_입력' && SUPABASE_URL.trim() !== '') {
                saveToSupabase(text, result);
            } else {
                console.warn('Supabase URL이 입력되지 않아 저장을 건너뜁니다.');
            }
            
        } catch (error) {
            console.error('분석 중 오류 발생:', error);
            alert('분석 중 오류가 발생했습니다. API 키가 올바른지 확인해주세요.\n오류 내용: ' + error.message);
        } finally {
            feedbackBtn.textContent = '피드백 받기 ✨';
            feedbackBtn.disabled = false;
        }
    });

    async function saveToSupabase(originalText, feedbackResult) {
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .insert([
                    {
                        original_text: originalText,
                        spelling_feedback: feedbackResult.spelling,
                        flow_feedback: feedbackResult.flow,
                        improvement_feedback: feedbackResult.improvement
                    }
                ]);
            
            if (error) throw error;
            console.log('데이터가 Supabase에 성공적으로 저장되었습니다!', data);
        } catch (err) {
            console.error('Supabase 저장 중 오류 발생:', err.message);
        }
    }

    async function analyzeTextWithGemini(text) {
        const prompt = `
당신은 초등학교 선생님을 돕는 친절한 AI 피드백 도우미입니다.
학생이 작성한 아래의 글을 읽고, 다음 3가지 항목에 대해 피드백을 작성해주세요. 
피드백 내용은 초등학생이 이해하기 쉽도록 친절하고 부드러운 말투로 작성해야 합니다. 줄바꿈은 <br> 태그를 사용하세요.

1. 맞춤법 교정 사항: 틀린 맞춤법이나 띄어쓰기를 짚어주고 올바른 표현을 알려주세요.
2. 문맥적 흐름 평가: 글의 전체적인 흐름, 주제의 일관성 등을 칭찬과 함께 평가해주세요.
3. 향후 개선점: 앞으로 더 좋은 글을 쓰기 위해 시도해보면 좋을 점을 제안해주세요.

반드시 아래의 JSON 형식으로만 응답해주세요:
{
  "spelling": "맞춤법 피드백 내용",
  "flow": "흐름 평가 내용",
  "improvement": "개선점 내용"
}

학생의 글:
${text}
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API 요청 실패 (${response.status})`);
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        return JSON.parse(responseText);
    }

    function showFeedbackResult(result) {
        // 결과 테이블에 내용 채우기
        feedbackBody.innerHTML = `
            <tr>
                <td>${result.spelling}</td>
                <td>${result.flow}</td>
                <td>${result.improvement}</td>
            </tr>
        `;

        // 결과 영역 보여주기
        resultSection.classList.remove('hidden');
        resultSection.classList.add('fade-in');
        
        // 결과 영역으로 부드럽게 스크롤
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
