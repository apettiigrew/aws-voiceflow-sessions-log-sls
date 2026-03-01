export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
};

export type SessionRecord = {
    id: string;
    userId: string;
    status: Status;
    createdAt: number;
    updatedAt: number;
    scheduledEndAt: number;
    voiceflowRequestSent: boolean;
};