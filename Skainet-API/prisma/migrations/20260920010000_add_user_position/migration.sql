-- Cargo operativo dentro del rol Joyero. Los administradores no requieren cargo de producción.
ALTER TABLE "User" ADD COLUMN "position" TEXT;
