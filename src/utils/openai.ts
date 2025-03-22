import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allowing API key usage in browser for this demo
});

// Function to transcribe audio using Whisper API
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Convert audio blob to File object
    const audioFile = new File(
      [audioBlob], 
      'recording.webm', 
      { type: audioBlob.type }
    );

    // Create a form data object
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    
    // Make the API call
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });
    
    return response.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    
    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('Invalid OpenAI API key. Please check your .env.local file.');
    }
    
    throw new Error('Failed to transcribe audio. Please try again.');
  }
}

// Types for analysis report
export interface RecommendationWithConfidence {
  recommendation: string;
  confidence: number; // 0-1 score
  rationale: string;
}

export interface AnalysisReport {
  executiveSummary: string;
  detailedFindings: string[];
  insights: string[];
  recommendations: RecommendationWithConfidence[];
  riskAssessment: {
    risks: { risk: string; severity: 'low' | 'medium' | 'high'; mitigation: string }[];
    overallRiskLevel: 'low' | 'medium' | 'high';
  };
  implementationTimeline: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

// Function to generate comprehensive analysis report using GPT-4o
export async function generateAnalysisReport(
  transcripts: string[], 
  topic: string,
  analysisType: 'health' | 'symptoms' | 'treatment' | 'general' = 'health'
): Promise<AnalysisReport> {
  try {
    // Check if OpenAI API key is set
    if (!import.meta.env.VITE_OPENAI_API_KEY || 
        import.meta.env.VITE_OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
      // Return mock data if no API key
      return getMockAnalysisReport(analysisType);
    }

    // Prepare the data for analysis
    const combinedTranscripts = transcripts.join('\n\n');
    
    // Create system prompt based on analysis type
    let systemPrompt = `You are an expert health analyst AI. Analyze the provided health-related memos and generate a comprehensive analysis report on the topic: "${topic}".`;
    
    switch (analysisType) {
      case 'symptoms':
        systemPrompt += ' Focus on symptom patterns, frequency, severity, and potential correlations between symptoms.';
        break;
      case 'treatment':
        systemPrompt += ' Focus on treatment efficacy, side effects, adherence patterns, and recommendations for optimizing treatment outcomes.';
        break;
      case 'health':
        systemPrompt += ' Focus on overall health trends, risk factors, protective factors, and lifestyle influences on health outcomes.';
        break;
      case 'general':
      default:
        systemPrompt += ' Provide a balanced analysis covering all relevant health aspects mentioned in the data.';
    }
    
    // Make the API call to GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt + ` Structure your response as a JSON object with the following sections:
            - executiveSummary: A concise overview of key findings
            - detailedFindings: Array of specific observations from the data
            - insights: Array of data-driven insights that may not be immediately obvious
            - recommendations: Array of objects, each with a 'recommendation', 'confidence' score (0-1), and 'rationale'
            - riskAssessment: Object with 'risks' array (each with 'risk', 'severity', and 'mitigation') and 'overallRiskLevel'
            - implementationTimeline: Object with 'immediate', 'shortTerm', and 'longTerm' action arrays`
        },
        {
          role: "user",
          content: `Here are my health memos for analysis on the topic "${topic}":\n\n${combinedTranscripts}`
        }
      ]
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    return JSON.parse(content) as AnalysisReport;
  } catch (error) {
    console.error('Error generating analysis report:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('Invalid OpenAI API key. Please check your .env.local file.');
    }
    throw new Error('Failed to generate analysis report. Please try again.');
  }
}

// Mock data for when API key is not available
function getMockAnalysisReport(type: 'health' | 'symptoms' | 'treatment' | 'general'): AnalysisReport {
  const baseReport: AnalysisReport = {
    executiveSummary: "This analysis is based on a series of health memos recorded over the past 30 days. The data suggests mild to moderate hypertension with associated symptoms of morning headaches and occasional dizziness. Lifestyle factors including diet and stress appear to be contributing factors.",
    detailedFindings: [
      "Blood pressure readings consistently above optimal levels (135/85 on average)",
      "Morning headaches reported in 65% of memos",
      "Dizziness when standing reported in 40% of memos",
      "Sleep quality appears suboptimal based on multiple references",
      "Dietary sodium intake potentially elevated based on food references"
    ],
    insights: [
      "Strong correlation between reported stress levels and blood pressure readings",
      "Symptoms appear to worsen after periods of poor sleep",
      "Exercise sessions correlate with temporary improvements in symptoms",
      "Hydration levels may be influencing symptom severity"
    ],
    recommendations: [
      {
        recommendation: "Implement DASH diet principles to reduce sodium intake",
        confidence: 0.87,
        rationale: "Evidence suggests dietary approaches to stop hypertension are effective for managing blood pressure levels in similar cases."
      },
      {
        recommendation: "Establish consistent sleep schedule with 7-8 hours per night",
        confidence: 0.82,
        rationale: "Poor sleep patterns correlate with worsening symptoms and increased blood pressure."
      },
      {
        recommendation: "Add 15-30 minutes of moderate exercise daily",
        confidence: 0.91,
        rationale: "Regular physical activity has strong evidence base for blood pressure reduction."
      },
      {
        recommendation: "Consider stress reduction techniques such as meditation",
        confidence: 0.78,
        rationale: "Stress appears to be a significant factor based on memo content analysis."
      }
    ],
    riskAssessment: {
      risks: [
        {
          risk: "Developing hypertension complications if left unaddressed",
          severity: "medium",
          mitigation: "Regular blood pressure monitoring and lifestyle modifications"
        },
        {
          risk: "Symptom progression affecting quality of life",
          severity: "medium",
          mitigation: "Adherence to recommended lifestyle changes and medical consultation"
        },
        {
          risk: "Potential medication side effects if pharmacological treatment initiated",
          severity: "low",
          mitigation: "Close monitoring and communication with healthcare provider"
        }
      ],
      overallRiskLevel: "medium"
    },
    implementationTimeline: {
      immediate: [
        "Begin daily blood pressure tracking",
        "Reduce sodium intake in diet",
        "Start basic walking routine"
      ],
      shortTerm: [
        "Schedule follow-up with healthcare provider",
        "Implement stress reduction techniques",
        "Optimize sleep environment and schedule"
      ],
      longTerm: [
        "Maintain consistent exercise regimen",
        "Regular (quarterly) health check-ups",
        "Consider DASH diet cooking classes or resources"
      ]
    }
  };

  // Customize based on type if needed
  switch (type) {
    case 'symptoms':
      baseReport.executiveSummary = "Analysis focuses on symptom patterns from health memos over 30 days. Primary symptoms include morning headaches, dizziness upon standing, and occasional fatigue. Symptom intensity appears to fluctuate with lifestyle factors.";
      break;
    case 'treatment':
      baseReport.executiveSummary = "Analysis of treatment effects based on health memos over 30 days. Current approaches show partial efficacy with room for optimization. Side effects appear minimal but adherence could be improved.";
      break;
    default:
      // Use the base report
  }

  return baseReport;
}