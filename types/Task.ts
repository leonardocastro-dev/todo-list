export type Priority = 'urgent' | 'important' | 'normal';
export type Status = 'pending' | 'completed';

export interface Task {
  id: string;
	title: string;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: Date;
}
