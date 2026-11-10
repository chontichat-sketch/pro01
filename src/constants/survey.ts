export interface SurveyQuestion {
  id: 'q1' | 'q2' | 'q3' | 'q4' | 'q5';
  number: number;
  title: string;
  shortLabel: string;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1',
    number: 1,
    title: 'เนื้อหาการอบรมมีความเหมาะสมและตรงกับความต้องการ',
    shortLabel: 'เนื้อหาการอบรม',
  },
  {
    id: 'q2',
    number: 2,
    title: 'วิทยากรมีความรู้ความสามารถและถ่ายทอดได้ชัดเจน',
    shortLabel: 'ความสามารถวิทยากร',
  },
  {
    id: 'q3',
    number: 3,
    title: 'สื่อ เอกสาร และอุปกรณ์ประกอบการอบรมมีคุณภาพ',
    shortLabel: 'สื่อและอุปกรณ์',
  },
  {
    id: 'q4',
    number: 4,
    title: 'ระยะเวลาในการอบรมมีความเหมาะสม',
    shortLabel: 'ระยะเวลาอบรม',
  },
  {
    id: 'q5',
    number: 5,
    title: 'ความพึงพอใจโดยรวมต่อการอบรมครั้งนี้',
    shortLabel: 'ความพึงพอใจโดยรวม',
  },
];

export const RATING_LABELS: Record<number, string> = {
  1: 'น้อยที่สุด',
  2: 'น้อย',
  3: 'ปานกลาง',
  4: 'มาก',
  5: 'มากที่สุด',
};

export interface SatisfactionLevel {
  label: string;
  colorClass: string;
  barColorClass: string;
}

export function getSatisfactionLevel(score: number): SatisfactionLevel {
  if (score >= 4.51) {
    return {
      label: 'มากที่สุด',
      colorClass: 'text-emerald-700',
      barColorClass: 'bg-emerald-600',
    };
  }
  if (score >= 3.51) {
    return {
      label: 'มาก',
      colorClass: 'text-emerald-600',
      barColorClass: 'bg-emerald-500',
    };
  }
  if (score >= 2.51) {
    return {
      label: 'ปานกลาง',
      colorClass: 'text-amber-600',
      barColorClass: 'bg-amber-500',
    };
  }
  if (score >= 1.51) {
    return {
      label: 'น้อย',
      colorClass: 'text-orange-600',
      barColorClass: 'bg-orange-500',
    };
  }
  return {
    label: 'น้อยที่สุด',
    colorClass: 'text-rose-600',
    barColorClass: 'bg-rose-500',
  };
}
