export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
};

export type SessionRecord = {
    id: string;
    userId: string;
    sessionId: string;
    status: Status;
    createdAt: number;
    updatedAt: number;       
    // Unix timestamp in milliseconds
    scheduledEndAt: number;
    voiceflowRequestSent: boolean;
  };