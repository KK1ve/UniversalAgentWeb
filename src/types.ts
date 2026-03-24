export interface Session {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SessionListResponse {
  items: Session[];
  total: number;
  limit: number;
  offset: number;
}

export interface Run {
  run_id: string;
  session_id: string;
  input: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string | null;
  total_input_tokens: number;
  total_output_tokens: number;
  created_at: string;
  finished_at?: string | null;
  messages?: Message[];
}

export interface Message {
  role: 'human' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[] | null;
  tool_call_id?: string | null;
  name?: string | null;
  input_tokens: number;
  output_tokens: number;
}

export interface ToolCall {
  name: string;
  args: any;
  id: string;
}

export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  model_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  name: string;
  description: string;
  enabled: boolean;
}

export interface UploadResponse {
  file_path: string;
  filename: string;
  size: number;
}

export interface ModelItem {
  id: string;
  model_id: string;
  display_name: string;
  provider_type: string;
  context_length: number;
  max_tokens: number;
  status: number;
}

export interface ModelChannelItem {
  id: string;
  name: string;
  type: string;
  base_url: string;
  status: number;
  models: ModelItem[];
}

export interface ModelChannelListResponse {
  items: ModelChannelItem[];
  total: number;
  limit: number;
  offset: number;
}
