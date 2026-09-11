declare class SecurityQuestionDto {
    question: string;
    answer: string;
}
export declare class CreateUserDto {
    id: string;
    name: string;
    role: string;
    password: string;
    phone?: string;
    securityQuestions?: SecurityQuestionDto[];
}
export {};
