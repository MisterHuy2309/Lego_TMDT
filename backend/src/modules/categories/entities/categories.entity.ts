
import {ProductsEntity} from '../../products/entities/products.entity'


export class CategoriesEntity {
  id: string ;
name: string ;
slug: string ;
parent_id: string  | null;
image_url: string  | null;
parent?: CategoriesEntity  | null;
children?: CategoriesEntity[] ;
products?: ProductsEntity[] ;
}
