import { MachinesService } from './machines.service';
export declare class MachinesController {
    private readonly machinesService;
    constructor(machinesService: MachinesService);
    findAll(): Promise<{
        id: string;
        name: string;
        status: string;
        type: string;
        cycleCount: number;
        maintenanceThreshold: number;
        lastMaintenance: Date | null;
    }[]>;
    increment(id: string): Promise<{
        id: string;
        name: string;
        status: string;
        type: string;
        cycleCount: number;
        maintenanceThreshold: number;
        lastMaintenance: Date | null;
    } | null>;
    report(id: string, issue: string): Promise<{
        id: string;
        name: string;
        status: string;
        type: string;
        cycleCount: number;
        maintenanceThreshold: number;
        lastMaintenance: Date | null;
    } | null>;
    fix(id: string): Promise<{
        id: string;
        name: string;
        status: string;
        type: string;
        cycleCount: number;
        maintenanceThreshold: number;
        lastMaintenance: Date | null;
    }>;
}
