
import {ProductsEntity} from '../../products/entities/products.entity'


export class ProductImagesEntity {
  id: string ;
product_id: string ;
image_url: string ;
is_primary: boolean ;
product?: ProductsEntity ;
}
