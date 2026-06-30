export interface SubStep {
  id: string;
  title: string;
  duration: number; // in minutes
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string
  subSteps: SubStep[];
  createdAt: string;
}
