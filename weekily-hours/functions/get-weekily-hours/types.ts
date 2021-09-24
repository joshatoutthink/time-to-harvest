export interface TimeEntry {
  id: number;
  spent_date: string;
  user: {
    id: number;
    name: string;
  };
  client: {
    id: number;
    name: string;
  };
  project: {
    id: number;
    name: string;
  };
  task: {
    id: number;
    name: string;
  };
  user_assignment: {
    id: number;
    is_project_manager: boolean;
    is_active: boolean;
    budget: null;
    created_at: string;
    updated_at: string;
    hourly_rate: number;
  };
  task_assignment: {
    id: number;
    billable: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    hourly_rate: number;
    budget: null;
  };
  hours: number;
  hours_without_timer: number;
  rounded_hours: number;
  notes: string;
  created_at: string;
  updated_at: string;
  is_locked: boolean;
  locked_reason: string;
  is_closed: boolean;
  is_billed: boolean;
  timer_started_at: null;
  started_time: string;
  ended_time: string;
  is_running: boolean;
  invoice: null;
  external_refereniwe: null;
  billable: boolean;
  budgeted: boolean;
  billable_rate: number;
  cost_rate: number;
}
