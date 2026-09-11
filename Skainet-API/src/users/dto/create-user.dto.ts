import { ApiProperty } from '@nestjs/swagger';

class SecurityQuestionDto {
  @ApiProperty({ example: '¿Cuál es el nombre de tu primera mascota?' })
  question: string;

  @ApiProperty({ example: 'Toby' })
  answer: string;
}

export class CreateUserDto {
  @ApiProperty({ example: '7', description: 'ID único del usuario' })
  id: string;

  @ApiProperty({ example: 'Carlos Gomez', description: 'Nombre completo' })
  name: string;

  @ApiProperty({ example: 'Joyero', description: 'Rol asignado (Administrador, Joyero, Dueno, Lider de Taller)' })
  role: string;

  @ApiProperty({ example: '123', description: 'Contraseña de acceso' })
  password: string;

  @ApiProperty({ example: '+573001234567', required: false, description: 'Teléfono de contacto' })
  phone?: string;

  @ApiProperty({
    type: [SecurityQuestionDto],
    required: false,
    description: 'Preguntas y respuestas de seguridad para recuperación'
  })
  securityQuestions?: SecurityQuestionDto[];
}
