/**
 * Health memo recording prompt suggestions
 * Organized by categories to provide diverse inspiration
 */

interface PromptCategory {
  name: string;
  icon: string; // Emoji icon for the category
  prompts: string[];
}

export const promptCategories: PromptCategory[] = [
  {
    name: "Symptoms",
    icon: "🩺",
    prompts: [
      "How has your energy level been today?",
      "Any new or recurring pain you've noticed?",
      "How has your sleep quality been this week?",
      "Any changes in appetite or digestion?",
      "Have you noticed any changes in your skin or hair?",
      "Any headaches or migraines to report?",
      "How has your breathing been today?",
      "Any dizziness or balance issues to note?",
      "Have your allergies affected you recently?",
      "Any changes in your vision or hearing?"
    ]
  },
  {
    name: "Medications",
    icon: "💊",
    prompts: [
      "Did you take all your medications today?",
      "Any side effects from your medications?",
      "Have you noticed any improvement since starting your new medication?",
      "Are you running low on any prescriptions?",
      "Did you adjust any medication dosages recently?",
      "How well is your pain medication working?",
      "Any reactions between different medications you're taking?",
      "Have you missed any doses this week?",
      "Any questions for your doctor about current medications?",
      "Are there any over-the-counter supplements you've been taking?"
    ]
  },
  {
    name: "Lifestyle",
    icon: "🏃",
    prompts: [
      "What type of exercise did you do today?",
      "How has your diet been this week?",
      "How much water have you been drinking daily?",
      "How are you managing stress lately?",
      "What relaxation techniques have you tried?",
      "How has your work-life balance been?",
      "Have you spent time outdoors recently?",
      "Any changes to your daily routine?",
      "How has your screentime affected your health?",
      "Have you practiced any mindfulness activities?"
    ]
  },
  {
    name: "Mood",
    icon: "😊",
    prompts: [
      "How would you describe your mood today?",
      "Any particular stressors affecting you?",
      "Have you noticed any patterns in your mood changes?",
      "How has your anxiety level been this week?",
      "What activities have improved your mood lately?",
      "Have you had trouble focusing or concentrating?",
      "How has your energy for social activities been?",
      "Any changes in motivation or interest in activities?",
      "How well have you been handling stress?",
      "Have you practiced any mental health exercises?"
    ]
  },
  {
    name: "Tracking",
    icon: "📊",
    prompts: [
      "What were your blood pressure readings today?",
      "What was your blood sugar level this morning?",
      "How has your weight changed recently?",
      "What was your heart rate during exercise?",
      "How many hours of sleep did you get last night?",
      "What was your body temperature today?",
      "How many steps or miles did you walk?",
      "What's your oxygen level measurement?",
      "Have you tracked your calorie intake today?",
      "Any patterns you've noticed in your vitals?"
    ]
  },
  {
    name: "Doctor Visit",
    icon: "👩‍⚕️",
    prompts: [
      "Questions you want to ask at your next appointment",
      "Recent test results you want to discuss",
      "Changes since your last doctor's visit",
      "Concerns about your current treatment plan",
      "New symptoms to report at your appointment",
      "Effectiveness of treatments since last visit",
      "Specialist referrals you might need",
      "Prescription refills to request",
      "Topics you're nervous to bring up with your doctor",
      "Results from any home testing kits"
    ]
  },
  {
    name: "Wellness",
    icon: "🧘",
    prompts: [
      "How well are you maintaining your health goals?",
      "Any new healthy habits you've started?",
      "How is your body responding to your fitness routine?",
      "How has your meditation practice been going?",
      "Any improvements in your flexibility or strength?",
      "How has your posture been while working?",
      "Have you spent time in nature this week?",
      "Any new healthy recipes you've tried?",
      "How is your breathing throughout the day?",
      "Have you taken time for self-care recently?"
    ]
  }
];

/**
 * Get a random selection of prompts from different categories
 * @param count Number of prompts to return
 * @returns Array of prompt strings
 */
export function getRandomPrompts(count: number = 3): string[] {
  // Shuffle the categories
  const shuffledCategories = [...promptCategories].sort(() => Math.random() - 0.5);
  
  // Take prompts from different categories
  const selectedPrompts: string[] = [];
  
  for (let i = 0; i < Math.min(count, shuffledCategories.length); i++) {
    const category = shuffledCategories[i];
    const randomPromptIndex = Math.floor(Math.random() * category.prompts.length);
    selectedPrompts.push(category.prompts[randomPromptIndex]);
  }
  
  return selectedPrompts;
}

/**
 * Get a specified number of random prompts from a specific category
 * @param categoryName The name of the category
 * @param count Number of prompts to return
 * @returns Array of prompt strings
 */
function getPromptsFromCategory(categoryName: string, count: number = 3): string[] {
  const category = promptCategories.find(cat => cat.name === categoryName);
  
  if (!category) return [];
  
  // Shuffle the prompts and take the requested number
  return [...category.prompts]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}