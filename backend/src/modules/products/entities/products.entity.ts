
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {CategoriesEntity} from '../../categories/entities/categories.entity'
import {ProductImagesEntity} from '../../product-images/entities/product-images.entity'
import {ProductSkusEntity} from '../../product-skus/entities/product-skus.entity'
import {ReviewsEntity} from '../../reviews/entities/reviews.entity'


export class ProductsEntity {
  id!: string ;
category_id!: string  | null;
name!: string ;
slug!: string ;
description!: string  | null;
item_number!: string  | null;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
piece_count!: number  | null;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
min_age!: number  | null;
@ApiProperty({
  type: `number`,
  format: `double`,
})
base_price!: Prisma.Decimal ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
rating_avg!: Prisma.Decimal ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
created_at!: Date ;
category?: CategoriesEntity  | null;
product_images?: ProductImagesEntity[] ;
product_skus?: ProductSkusEntity[] ;
reviews?: ReviewsEntity[] ;
}
