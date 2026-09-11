"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SecurityQuestionDto {
    question;
    answer;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '¿Cuál es el nombre de tu primera mascota?' }),
    __metadata("design:type", String)
], SecurityQuestionDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Toby' }),
    __metadata("design:type", String)
], SecurityQuestionDto.prototype, "answer", void 0);
class CreateUserDto {
    id;
    name;
    role;
    password;
    phone;
    securityQuestions;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '7', description: 'ID único del usuario' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Carlos Gomez', description: 'Nombre completo' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Joyero', description: 'Rol asignado (Administrador, Joyero, Dueno, Lider de Taller)' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123', description: 'Contraseña de acceso' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+573001234567', required: false, description: 'Teléfono de contacto' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [SecurityQuestionDto],
        required: false,
        description: 'Preguntas y respuestas de seguridad para recuperación'
    }),
    __metadata("design:type", Array)
], CreateUserDto.prototype, "securityQuestions", void 0);
//# sourceMappingURL=create-user.dto.js.map