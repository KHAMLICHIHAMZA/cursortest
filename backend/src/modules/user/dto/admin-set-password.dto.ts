import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AdminSetPasswordDto {
  @ApiPropertyOptional({
    description:
      "Nouveau mot de passe (min. 8 caractères). Si omis, un mot de passe est généré automatiquement.",
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
  password?: string;

  @ApiProperty({
    description:
      "Si true, envoie le mot de passe par e-mail à l'utilisateur. Si false, le mot de passe est renvoyé une seule fois dans la réponse API (cas boîte mail indisponible).",
  })
  @IsBoolean()
  sendEmail: boolean;
}
