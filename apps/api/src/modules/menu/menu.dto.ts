import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsInt,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  NotContains,
  ValidateNested,
} from 'class-validator';

export const DISH_KEY_PATTERN = '^[a-z0-9]+(-[a-z0-9]+)*$';
export const MAX_VERSION = 2_147_483_647;
export const MAX_MENU_PRICE = 100_000_000;

export class MenuItemDto {
  @IsString()
  @Matches(/\S/u)
  @MaxLength(90)
  @NotContains('\0')
  name!: string;

  @IsString()
  @Matches(/\S/u)
  @MaxLength(60)
  @NotContains('\0')
  category!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_MENU_PRICE)
  price!: number;

  @IsString()
  @MaxLength(300)
  @NotContains('\0')
  description!: string;

  @IsBoolean()
  available!: boolean;

  @IsBoolean()
  published!: boolean;
}

export class UpdateMenuItemDto {
  @IsInt()
  @Min(1)
  @Max(MAX_VERSION)
  expectedVersion!: number;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => MenuItemDto)
  item!: MenuItemDto;
}
