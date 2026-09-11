import { StatsService } from './stats.service';
export declare class StatsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    getStats(): Promise<{
        totalLoss: number;
        ranking: {
            name: any;
            avgMinutes: number;
            completedCount: number;
        }[];
        incidentCount: number;
        totalProduced: number;
        activeWork: number;
    }>;
}
