export enum MainThreadMessageType {
  SourceCode,
  Input,
  ProgramInterrupt,
};

export type MainThreadMessage = {
  type: MainThreadMessageType,
  value: string // SourceCode
    | number // Input
};

export enum WorkerMessageType {
  AskForInput,
  ProgramOutput
};

export type WorkerMessage = {
  type: WorkerMessageType,
  value: string | null
};
