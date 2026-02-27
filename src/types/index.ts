// src/types/index.ts
// ============================================================
// Shared TypeScript types matching the DB schema exactly.
// ============================================================

export type LevelType = 'school' | 'exam';

export type LevelName =
  | 'JS1' | 'JS2' | 'JS3'
  | 'SS1' | 'SS2' | 'SS3'
  | 'WAEC' | 'JAMB' | 'NECO';

export const SCHOOL_LEVELS: LevelName[] = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];
export const EXAM_LEVELS:   LevelName[] = ['WAEC', 'JAMB', 'NECO'];

export function getLevelType(level: LevelName): LevelType {
  return EXAM_LEVELS.includes(level) ? 'exam' : 'school';
}

export interface LearningPath {
  id:              string;
  name:            string;
  slug:            string;
  mode:            LevelType;
  grade:           LevelName;
  level_type:      LevelType;
  level_name:      LevelName;
  description:     string | null;
  icon:            string | null;
  is_active:       boolean;
  sort_order:      number;
  has_curriculum:  boolean;
  created_at:      string;
  updated_at:      string;
}

export interface Topic {
  id:               string;
  learning_path_id: string;
  name:             string;
  slug:             string;
  icon:             string | null;
  description:      string | null;
  sort_order:       number;
  is_active:        boolean;
  ai_generated:     boolean;
  generated_at:     string | null;
  created_at:       string;
  updated_at:       string;
}

export interface Subtopic {
  id:           string;
  topic_id:     string;
  name:         string;
  slug:         string;
  sort_order:   number;
  is_active:    boolean;
  ai_generated: boolean;
  generated_at: string | null;
  created_at:   string;
  updated_at:   string;
}

export interface Lesson {
  id:                           string;
  subtopic_id:                  string;
  title:                        string;
  introduction:                 string;
  explanation:                  string;
  summary:                      string | null;
  approved:                     boolean;
  ai_generated:                 boolean;
  generated_at:                 string | null;
  extended_questions_generated: boolean;
  created_at:                   string;
  updated_at:                   string;
}

export interface LessonExample {
  id:         string;
  lesson_id:  string;
  title:      string;
  problem:    string;
  steps:      string[] | string;   // stored as JSON string, parsed to array
  sort_order: number;
  created_at: string;
}

export interface PracticeQuestion {
  id:          string;
  lesson_id:   string;
  category:    'lesson' | 'extended';
  question:    string;
  options:     string[] | string;   // stored as JSON string, parsed to array
  answer:      number;
  explanation: string;
  sort_order:  number;
  ai_generated: boolean;
  created_at:  string;
}

export interface UserProfile {
  id:          string;
  name:        string;
  grade:       LevelName;
  mode:        LevelType;
  total_xp:    number;
  streak:      number;
  last_active: string | null;
  is_admin:    boolean;
  created_at:  string;
  updated_at:  string;
}

// Hook return types
export type ContentStatus =
  | 'idle'
  | 'loading'
  | 'no_curriculum'
  | 'generating'
  | 'ready'
  | 'error';

export interface TopicsResult {
  data:     Topic[];
  status:   ContentStatus;
  error:    string | null;
  loading:  boolean;
  refetch:  () => void;
}

export interface SubtopicsResult {
  data:     Subtopic[];
  status:   ContentStatus;
  error:    string | null;
  loading:  boolean;
}

export interface LessonResult {
  lesson:       Lesson | null;
  examples:     LessonExample[];
  questions:    PracticeQuestion[];
  status:       ContentStatus;
  error:        string | null;
  loading:      boolean;
  isGenerating: boolean;
}
